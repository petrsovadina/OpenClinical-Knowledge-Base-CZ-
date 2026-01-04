# 🏥 OpenClinical Knowledge Base (CZ)

![Status](https://img.shields.io/badge/Status-Concept%20%2F%20Alpha-orange)
![License](https://img.shields.io/badge/License-MIT-blue)
![Domain](https://img.shields.io/badge/Domain-Healthcare-red)
![Language](https://img.shields.io/badge/Language-Czech-green)

**Open-source strukturovaná znalostní báze pro AI v českém zdravotnictví.**

Cílem tohoto projektu je transformovat nestrukturované lékařské texty (doporučené postupy, SPC, věstníky) do strojově čitelného formátu (JSON), který umožní vývoj bezpečných a fakticky přesných AI aplikací (RAG, Chatbots, Decision Support) v prostředí českého zdravotnictví.

---

## ⚠️ DŮLEŽITÉ UPOZORNĚNÍ (MDR & Legal Disclaimer)

**Tento projekt, software a data v něm obsažená slouží VÝHRADNĚ pro informační, vzdělávací a výzkumné účely.**

1.  ❌ **Nejedná se o zdravotnický prostředek** ve smyslu Nařízení EU 2017/745 (MDR) ani zákona č. 268/2014 Sb.
2.  ❌ Software a data **neposkytují diagnózu** ani terapeutická doporučení pro konkrétní pacienty.
3.  ✅ Software slouží jako **inteligentní vyhledávač** v odborné literatuře (Information Retrieval System).

**Pro uživatele (lékaře):** Jakékoliv použití dat v klinické praxi podléhá vaší výhradní odpovědnosti. Informace získané z tohoto zdroje je nutné ověřit v originálním dokumentu (SPC, Věstník MZ, Doporučený postup), na který data vždy odkazují.

---

## 🎯 Cíle projektu

1.  **Strukturovat chaos:** Převést tisíce PDF dokumentů (KDP, Věstníky, SPC) na sémantická data.
2.  **Podpořit AI vývoj:** Poskytnout čistý, citovatelný dataset pro trénink a grounding (RAG) českých LLM modelů, který v ČR chybí.
3.  **Farmakologická bezpečnost:** Vytvořit mapu lékových interakcí na základě otevřených dat SÚKL.
4.  **Otevřenost:** Data jsou a zůstanou open-source, aby sloužila celé komunitě.

## 📚 Datové zdroje

Projekt integruje data výhradně z veřejných, oficiálních a důvěryhodných zdrojů:

* **SÚKL (Opendata):** Číselníky léčiv, SPC (Souhrny údajů o přípravku) pro interakce a kontraindikace.
* **KDP ÚZIS / NIKEZ:** Národní klinické doporučené postupy a metodiky garantované státem.
* **Odborné společnosti ČLS JEP:** Doporučené postupy jednotlivých odborností (např. Kardiologická, Diabetologická spol.).
* **WikiSkripta (1. LF UK):** Validované klinické články (s důrazem na filtrování garantovaného obsahu).

## 🏗 Struktura repozitáře

```text
open-clinical-kb-cz/
├── data/
│   ├── raw/                  # Surová data (PDF, HTML dump) - ignorováno v gitu
│   ├── processed/            # Finální JSONL soubory (Guidelines, Interactions) - TOTO JE PRODUKT
│   └── synthetic/            # AI generované kazuistiky pro trénink
├── docs/
│   ├── PRD.md                # Produktová specifikace (Business & Scope)
│   └── TECHNICAL_SPEC.md     # Technická architektura scraperů a ETL
├── schemas/                  # JSON Schémata pro validaci dat (Pydantic modely)
│   ├── guideline.schema.json
│   └── drug_interaction.schema.json
└── scripts/                  # ETL Pipeline (Scrapers, Parsers, Extractors)
