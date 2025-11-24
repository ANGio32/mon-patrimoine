import streamlit as st
import pandas as pd
import yfinance as yf
import plotly.express as px
import gspread

# --- CONFIGURATION GOOGLE SHEETS ---
def get_data_from_sheets():
    try:
        # Connexion sécurisée
        gc = gspread.service_account_from_dict(st.secrets["gcp_service_account"])
        sh = gc.open("MaBourse") 
        worksheet = sh.sheet1
        data = worksheet.get_all_records()
        return pd.DataFrame(data)
    except Exception as e:
        return pd.DataFrame()

def add_row_to_sheets(new_data):
    try:
        gc = gspread.service_account_from_dict(st.secrets["gcp_service_account"])
        sh = gc.open("MaBourse")
        worksheet = sh.sheet1
        worksheet.append_row(new_data)
        st.toast("✅ Sauvegardé !", icon="💾")
        st.cache_data.clear()
    except Exception as e:
        st.error(f"Erreur : {e}")

# --- INTERFACE ---
st.set_page_config(page_title="Mon Patrimoine", layout="wide", page_icon="💰")

# Chargement (Cache 1 min)
@st.cache_data(ttl=60)
def load_portfolio():
    return get_data_from_sheets()

df = load_portfolio()

# --- BARRE LATÉRALE ---
st.sidebar.title("🎯 Menu")

# Filtre Vue
options = ["Vue Famille"] + (df["Membre"].unique().tolist() if not df.empty else [])
vue = st.sidebar.selectbox("Filtrer par :", options)

st.sidebar.markdown("---")

# Formulaire
st.sidebar.subheader("➕ Ajouter")
with st.sidebar.form("add_form", clear_on_submit=True):
    col1, col2 = st.columns(2)
    membre = col1.text_input("Membre", "Moi")
    plateforme = col2.selectbox("Plateforme", ["Wealthsimple", "Disnat", "Questrade", "BNCD", "Crypto.com"])
    
    col3, col4 = st.columns(2)
    compte = col3.selectbox("Compte", ["CELI", "REER", "CELIAPP", "Cash", "Crypto"])
    type_actif = col4.selectbox("Type", ["ETF", "Action", "Crypto"])
    
    ticker = st.text_input("Symbole (ex: VFV.TO)", "VFV.TO").upper()
    devise = st.selectbox("Devise", ["CAD", "USD"])
    qty = st.number_input("Qté", min_value=0.01, step=1.0)
    prix = st.number_input("Prix Achat", min_value=0.0)
    
    if st.form_submit_button("Sauvegarder"):
        add_row_to_sheets([membre, plateforme, compte, ticker, type_actif, qty, prix, devise])
        st.rerun()

# --- CALCULS ---
try:
    fx = yf.download("CAD=X", period="1d", progress=False)['Close'].iloc[-1]
except:
    fx = 1.35

# Filtrage
df_view = df if vue == "Vue Famille" else df[df["Membre"] == vue]

if not df_view.empty:
    st.title(f"💰 Patrimoine : {vue}")
    
    # Prix en direct
    tickers = df_view["Ticker"].unique().tolist()
    if tickers:
        try:
            live = yf.download(tickers, period="1d", progress=False)['Close']
            def get_price(t):
                if len(tickers) == 1: return float(live.iloc[-1])
                return float(live[t].iloc[-1])
            df_view["Prix_Actuel"] = df_view["Ticker"].apply(get_price)
        except:
            df_view["Prix_Actuel"] = df_view["Prix_Achat"]
    
    # Conversion CAD
    df_view["Total_CAD"] = df_view.apply(lambda x: (x["Prix_Actuel"] * x["Quantité"]) * (fx if x["Devise"]=="USD" else 1), axis=1)
    df_view["Cout_CAD"] = df_view.apply(lambda x: (x["Prix_Achat"] * x["Quantité"]) * (fx if x["Devise"]=="USD" else 1), axis=1)
    df_view["Plus_Value"] = df_view["Total_CAD"] - df_view["Cout_CAD"]

    # KPIs
    k1, k2, k3 = st.columns(3)
    k1.metric("Total", f"{df_view['Total_CAD'].sum():,.0f} $")
    k2.metric("Plus-Value", f"{df_view['Plus_Value'].sum():+,.0f} $")
    k3.metric("Lignes", len(df_view))
    
    st.divider()

    # Graphiques
    g1, g2 = st.columns(2)
    g1.plotly_chart(px.sunburst(df_view, path=['Compte', 'Ticker'], values='Total_CAD'), use_container_width=True)
    g2.plotly_chart(px.pie(df_view, values='Total_CAD', names='Plateforme', hole=0.5), use_container_width=True)
    
    # Tableau
    st.dataframe(df_view[["Membre", "Compte", "Ticker", "Quantité", "Total_CAD", "Plus_Value"]], use_container_width=True)

else:
    st.info("👈 Ajoute ton premier investissement dans le menu !")
