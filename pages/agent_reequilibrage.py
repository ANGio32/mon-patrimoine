import streamlit as st
import pandas as pd
import yfinance as yf
import plotly.express as px
import gspread
import anthropic

st.set_page_config(page_title="Agent Rééquilibrage", layout="wide", page_icon="⚖️")


@st.cache_data(ttl=60)
def load_portfolio():
    try:
        gc = gspread.service_account_from_dict(st.secrets["gcp_service_account"])
        sh = gc.open("MaBourse")
        data = sh.sheet1.get_all_records()
        return pd.DataFrame(data)
    except Exception as e:
        st.error(f"Erreur Google Sheets : {e}")
        return pd.DataFrame()


@st.cache_data(ttl=300)
def get_live_prices(tickers: list[str]) -> dict:
    if not tickers:
        return {}
    try:
        live = yf.download(tickers, period="1d", progress=False)["Close"]
        if len(tickers) == 1:
            return {tickers[0]: float(live.iloc[-1])}
        return {t: float(live[t].iloc[-1]) for t in tickers if t in live.columns}
    except Exception:
        return {}


def get_fx() -> float:
    try:
        return float(yf.download("CAD=X", period="1d", progress=False)["Close"].iloc[-1])
    except Exception:
        return 1.35


def enrich_portfolio(df: pd.DataFrame, fx: float) -> pd.DataFrame:
    df = df.copy()
    tickers = df["Ticker"].unique().tolist()
    prices = get_live_prices(tickers)
    df["Prix_Actuel"] = df["Ticker"].map(prices).fillna(df["Prix_Achat"])
    df["Total_CAD"] = df.apply(
        lambda r: r["Prix_Actuel"] * r["Quantité"] * (fx if r["Devise"] == "USD" else 1),
        axis=1,
    )
    df["Cout_CAD"] = df.apply(
        lambda r: r["Prix_Achat"] * r["Quantité"] * (fx if r["Devise"] == "USD" else 1),
        axis=1,
    )
    df["Plus_Value"] = df["Total_CAD"] - df["Cout_CAD"]
    return df


def compute_rebalancing(df: pd.DataFrame, targets: dict[str, float]) -> pd.DataFrame:
    """Compare current allocation vs targets, return trade recommendations."""
    total = df["Total_CAD"].sum()
    if total == 0:
        return pd.DataFrame()

    current = df.groupby("Type")["Total_CAD"].sum().to_dict()
    rows = []
    for asset_type, target_pct in targets.items():
        current_val = current.get(asset_type, 0.0)
        target_val = total * (target_pct / 100)
        delta = target_val - current_val
        rows.append({
            "Type": asset_type,
            "Actuel ($)": current_val,
            "Cible ($)": target_val,
            "Actuel (%)": (current_val / total * 100) if total else 0,
            "Cible (%)": target_pct,
            "Delta ($)": delta,
            "Action": "🟢 Acheter" if delta > 0 else ("🔴 Vendre" if delta < 0 else "✅ OK"),
        })
    return pd.DataFrame(rows)


def ask_claude(summary: str, rebalancing_df: pd.DataFrame) -> str:
    client = anthropic.Anthropic(api_key=st.secrets["ANTHROPIC_API_KEY"])
    table_md = rebalancing_df.to_markdown(index=False)
    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        messages=[
            {
                "role": "user",
                "content": f"""Tu es un conseiller financier expert en marchés canadiens.

Voici le résumé du portefeuille :
{summary}

Voici l'analyse de rééquilibrage (en CAD) :
{table_md}

Donne une analyse concise en 3-5 points :
1. État général du portefeuille
2. Priorité des ajustements à faire
3. Risques à surveiller
4. Conseil fiscal (CELI / REER / CELIAPP)
5. Un conseil pratique et actionnable

Réponds en français, de façon directe et professionnelle.""",
            }
        ],
    )
    return message.content[0].text


# --- UI ---
st.title("⚖️ Agent de Rééquilibrage")
st.caption("Définissez vos cibles d'allocation et obtenez un plan d'action personnalisé.")

df_raw = load_portfolio()

if df_raw.empty:
    st.info("👈 Aucune donnée de portefeuille trouvée. Ajoutez des positions depuis la page principale.")
    st.stop()

fx = get_fx()

# Sidebar filters
with st.sidebar:
    st.header("🔧 Paramètres")
    membres = ["Famille"] + df_raw["Membre"].unique().tolist()
    membre_sel = st.selectbox("Vue", membres)
    st.markdown("---")
    st.subheader("🎯 Allocations cibles (%)")
    target_etf = st.slider("ETF", 0, 100, 60)
    target_action = st.slider("Action", 0, 100, 30)
    target_crypto = st.slider("Crypto", 0, 100, 10)
    total_target = target_etf + target_action + target_crypto
    if total_target != 100:
        st.warning(f"Total : {total_target}% (doit être 100%)")

# Filter data
df_view = df_raw if membre_sel == "Famille" else df_raw[df_raw["Membre"] == membre_sel]
df = enrich_portfolio(df_view, fx)

# KPIs
total_val = df["Total_CAD"].sum()
total_gain = df["Plus_Value"].sum()
k1, k2, k3 = st.columns(3)
k1.metric("Valeur totale", f"{total_val:,.0f} $")
k2.metric("Plus-value", f"{total_gain:+,.0f} $", delta_color="normal")
k3.metric("Positions", len(df))

st.divider()

# Current allocation chart
col_chart, col_targets = st.columns([1, 1])
with col_chart:
    st.subheader("Allocation actuelle")
    by_type = df.groupby("Type")["Total_CAD"].sum().reset_index()
    fig = px.pie(by_type, values="Total_CAD", names="Type", hole=0.5,
                 color_discrete_sequence=px.colors.qualitative.Set2)
    st.plotly_chart(fig, use_container_width=True)

with col_targets:
    st.subheader("Allocation cible")
    targets = {"ETF": target_etf, "Action": target_action, "Crypto": target_crypto}
    target_df = pd.DataFrame({"Type": list(targets.keys()), "Cible (%)": list(targets.values())})
    fig2 = px.pie(target_df, values="Cible (%)", names="Type", hole=0.5,
                  color_discrete_sequence=px.colors.qualitative.Set2)
    st.plotly_chart(fig2, use_container_width=True)

st.divider()

# Rebalancing table
if total_target == 100:
    st.subheader("📋 Plan de rééquilibrage")
    rebal_df = compute_rebalancing(df, targets)

    styled = rebal_df.copy()
    styled["Actuel ($)"] = styled["Actuel ($)"].map(lambda x: f"{x:,.0f} $")
    styled["Cible ($)"] = styled["Cible ($)"].map(lambda x: f"{x:,.0f} $")
    styled["Actuel (%)"] = styled["Actuel (%)"].map(lambda x: f"{x:.1f}%")
    styled["Cible (%)"] = styled["Cible (%)"].map(lambda x: f"{x:.1f}%")
    styled["Delta ($)"] = styled["Delta ($)"].map(lambda x: f"{x:+,.0f} $")
    st.dataframe(styled, use_container_width=True, hide_index=True)

    # Detailed trades per ticker
    st.subheader("📊 Détail par position")
    df_detail = df[["Ticker", "Type", "Compte", "Prix_Actuel", "Quantité", "Total_CAD"]].copy()
    df_detail["Poids (%)"] = (df_detail["Total_CAD"] / total_val * 100).map(lambda x: f"{x:.1f}%")
    df_detail["Total_CAD"] = df_detail["Total_CAD"].map(lambda x: f"{x:,.0f} $")
    df_detail["Prix_Actuel"] = df_detail["Prix_Actuel"].map(lambda x: f"{x:.2f}")
    st.dataframe(df_detail, use_container_width=True, hide_index=True)

    st.divider()

    # Claude analysis
    st.subheader("🤖 Analyse par l'agent IA")
    if st.button("Générer l'analyse", type="primary"):
        summary = (
            f"Portefeuille : {membre_sel}\n"
            f"Valeur totale : {total_val:,.0f} $ CAD\n"
            f"Plus-value latente : {total_gain:+,.0f} $ CAD\n"
            f"Taux USD/CAD : {fx:.4f}\n"
            f"Comptes utilisés : {', '.join(df['Compte'].unique())}\n"
            f"Plateformes : {', '.join(df['Plateforme'].unique())}\n"
        )
        with st.spinner("L'agent analyse votre portefeuille..."):
            try:
                analysis = ask_claude(summary, rebal_df)
                st.markdown(analysis)
            except Exception as e:
                st.error(f"Erreur API Claude : {e}")
                st.info("Vérifiez que la clé ANTHROPIC_API_KEY est configurée dans les secrets Streamlit.")
else:
    st.warning("⚠️ Ajustez les curseurs pour que le total des cibles soit égal à 100%.")
