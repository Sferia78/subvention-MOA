/* ============================================================
   BASE DE DISPOSITIFS — Simulateur Subventions MOA
   Fichier de données versionnable (Git). Modifier ICI, jamais dans index.html.
   Schéma par dispositif :
   - id, nom, fin (financeur), cat (catégorie), desc, url (source)
   - verifiedAt : date de dernière vérification humaine de la fiche
   - cumul : note sur les règles de cumul connues
   - sub:[min,max] €/logement (subvention/prime) | pret:[min,max] | fiscal:true
   - el(op)   => {s:'ok'|'maybe'|'no', r:'raison'}
   - jalons(op) => [{date, label, type:'action'|'limite'|'info'}]
   op = {type, nb, cout, conv, dpe1, dpe2, idf, qpv, rdc, audit,
         dDepot, dMarche, dOS, dLiv (Date), phases:[{n,d}]}
   ============================================================ */
(function(){
const addM=(dt,m)=>{const d=new Date(dt); d.setMonth(d.getMonth()+m); return d;};
const addY=(dt,y)=>{const d=new Date(dt); d.setFullYear(d.getFullYear()+y); return d;};

window.DISPOSITIFS={
meta:{
  version:"3.0.0-sprint1",
  updated:"2026-07-20",
  note:"Montants indicatifs. Chaque fiche porte sa date de vérification et sa source. Règles de délais génériques : les délais réels sont fixés par chaque arrêté d'attribution.",
  sources:["banquedesterritoires.fr","financement-logement-social.logement.gouv.fr","aides-territoires.beta.gouv.fr","drihl.ile-de-france.developpement-durable.gouv.fr","ecologie.gouv.fr","anru.fr"]
},
items:[
{id:'ecopls', nom:"Éco-PLS (éco-prêt logement social)", fin:"Banque des Territoires", cat:"Prêt bonifié",
 verifiedAt:"2026-07-20", cumul:"Cumulable CEE, subventions locales, Seconde Vie. Adossé au conventionnement.",
 desc:"Prêt bonifié réhab énergétique du parc social. Jusqu'à ≈33 k€/logement, durées 25-40 ans, bonus sortie de passoire.",
 url:"https://www.banquedesterritoires.fr/produits-services/prets-long-terme/pret-eco-pret",
 el:o=>o.type!=='rehab'?{s:'no',r:"Réservé à la réhabilitation."}:['D','E','F','G'].includes(o.dpe1)?{s:'ok',r:"Réhab + DPE avant "+o.dpe1+" : éligible (vérifier seuils kWh/CO2)."}:{s:'maybe',r:"DPE avant trop performant : vérifier seuils conso/émissions."},
 pret:[15000,33000],
 jalons:o=>[
  {date:o.dDepot, label:"Dépôt dossier Éco-PLS (avant tout commencement)", type:'action'},
  {date:addM(o.dDepot,4), label:"Décision/contrat de prêt attendu (instruction ≈3-5 mois)", type:'info'},
  {date:o.dOS, label:"Limite : ne pas démarrer avant accord (commencement d'exécution)", type:'limite'},
  {date:addM(o.dLiv,12), label:"Justificatifs de performance post-travaux (DPE après)", type:'action'}]},

{id:'secondevie', nom:"Dispositif « Seconde Vie »", fin:"État (agrément) — TVA 5,5 % + TFPB ~25 ans + loyers", cat:"Avantage fiscal majeur",
 verifiedAt:"2026-07-20", cumul:"Se combine avec Éco-PLS et CEE. Conditionne le régime fiscal de toute l'opération.",
 desc:"Réhab lourde « équivalent neuf » (DPE A/B) de logements conventionnés depuis 40+ ans. Change l'équation économique.",
 url:"https://www.financement-logement-social.logement.gouv.fr/dispositif-seconde-vie-a2270.html",
 el:o=>{const age=new Date().getFullYear()-o.conv;
   if(o.type!=='rehab') return {s:'no',r:"Réhabilitation lourde uniquement."};
   if(age<40) return {s:'no',r:"Conventionné depuis "+age+" ans (<40 ans requis)."};
   if(!['A','B'].includes(o.dpe2)) return {s:'maybe',r:"DPE cible "+o.dpe2+" : viser A ou B pour l'éligibilité."};
   return {s:'ok',r:"Conventionné depuis "+age+" ans + cible DPE "+o.dpe2+" : profil idéal. Agrément préalable obligatoire."};},
 fiscal:true,
 jalons:o=>[
  {date:addM(o.dDepot,-2), label:"Monter le dossier d'agrément Seconde Vie (avant dépôt global)", type:'action'},
  {date:addM(o.dDepot,6), label:"Agrément préfectoral attendu — conditionne TVA 5,5 % et TFPB", type:'info'},
  {date:o.dOS, label:"Limite : agrément à obtenir avant démarrage des travaux", type:'limite'},
  {date:o.dLiv, label:"Atteinte DPE A/B à justifier + avenant convention APL (loyers)", type:'action'}]},

{id:'cee177', nom:"CEE — Coup de pouce « Rénovation globale collectif » (BAR-TH-177)", fin:"Obligés / délégataires CEE", cat:"Prime CEE",
 verifiedAt:"2026-07-20", cumul:"Non cumulable avec d'autres valorisations CEE sur les mêmes gestes. Cumulable subventions/prêts.",
 desc:"Valorisation CEE renforcée pour rénovation globale résidentiel collectif. Audit énergétique réglementaire requis.",
 url:"https://www.ecologie.gouv.fr/politiques-publiques/certificats-economies-denergie",
 el:o=>o.type!=='rehab'?{s:'no',r:"Rénovation uniquement."}:o.audit?{s:'ok',r:"Audit fait : négocier la prime AVANT signature des marchés."}:{s:'maybe',r:"Audit énergétique réglementaire à réaliser d'abord."},
 sub:[1500,5000],
 jalons:o=>[
  {date:addM(o.dMarche,-3), label:"Consulter les obligés CEE / signer la convention (rôle actif incitatif)", type:'action'},
  {date:o.dMarche, label:"LIMITE ABSOLUE : convention CEE signée AVANT signature des marchés", type:'limite'},
  {date:addM(o.dLiv,6), label:"Dépôt du dossier CEE (factures, attestations fin de travaux)", type:'action'}]},

{id:'tfpb', nom:"Dégrèvement TFPB travaux d'économies d'énergie", fin:"DGFiP (droit commun art. 1391 E CGI)", cat:"Avantage fiscal",
 verifiedAt:"2026-07-20", cumul:"Non cumulable avec l'exonération Seconde Vie sur la même assiette.",
 desc:"Dégrèvement de TFPB à hauteur d'une fraction des dépenses d'économies d'énergie payées.",
 url:"https://www.financement-logement-social.logement.gouv.fr/",
 el:o=>o.type==='rehab'||o.type==='acqam'?{s:'ok',r:"Travaux d'économie d'énergie sur parc social : mobilisable."}:{s:'no',r:"Sans objet en construction neuve."},
 fiscal:true,
 jalons:o=>[{date:addM(o.dLiv,3), label:"Déclaration du dégrèvement TFPB (année suivant paiement des dépenses)", type:'action'}]},

{id:'scf', nom:"Subvention pour surcharge foncière", fin:"État / délégataire aides à la pierre", cat:"Subvention",
 verifiedAt:"2026-07-20", cumul:"S'ajoute aux subventions principales de l'agrément.",
 desc:"Compense un coût foncier supérieur aux valeurs de référence — quasi systématique à étudier en IDF.",
 url:"https://www.financement-logement-social.logement.gouv.fr/",
 el:o=>(o.type==='neuf'||o.type==='acqam')?(o.idf?{s:'ok',r:"Opération francilienne : à intégrer au dossier d'agrément."}:{s:'maybe',r:"Selon zone et charge foncière."}):{s:'no',r:"Liée à une opération avec agrément neuf/acq-am."},
 sub:[2000,10000],
 jalons:o=>[
  {date:o.dDepot, label:"Demande avec le dossier d'agrément PLUS/PLAI (avant commencement)", type:'action'},
  {date:o.dOS, label:"Limite : décision avant démarrage", type:'limite'}]},

{id:'agrement', nom:"Agréments + subventions PLUS/PLAI", fin:"État / délégataire (DRIHL, EPT, CD)", cat:"Subvention + prêts CDC",
 verifiedAt:"2026-07-20", cumul:"Socle : conditionne TVA réduite, TFPB, prêts CDC, surcharge foncière.",
 desc:"Le socle du neuf et de l'acquisition-amélioration : agrément, subvention PLAI, prêts CDC adossés, TVA réduite, TFPB.",
 url:"https://www.financement-logement-social.logement.gouv.fr/",
 el:o=>(o.type==='neuf'||o.type==='acqam'||o.type==='demol')?{s:'ok',r:"Passage obligé : la programmation annuelle du délégataire fixe la fenêtre de dépôt."}:{s:'no',r:"Réhab : hors champ agréments (sauf restructuration lourde assimilée)."},
 sub:[0,12000],
 jalons:o=>[
  {date:addM(o.dDepot,-1), label:"Caler le dossier sur la programmation annuelle du délégataire", type:'action'},
  {date:o.dDepot, label:"Dépôt demande d'agrément (avant tout commencement d'exécution)", type:'action'},
  {date:o.dOS, label:"Limite : décision favorable avant OS (sinon autorisation anticipée écrite)", type:'limite'},
  {date:addY(o.dDepot,2), label:"Caducité type : commencer les travaux (prorogation à demander AVANT)", type:'limite'},
  {date:addY(o.dLiv,1), label:"Justification / clôture : prix de revient définitif, solde subvention", type:'action'}]},

{id:'anru', nom:"Concours financiers ANRU (NPNRU)", fin:"ANRU", cat:"Subvention + prêts bonifiés AL",
 verifiedAt:"2026-07-20", cumul:"Règles propres à la convention de quartier ; articulé avec Action Logement.",
 desc:"Démolitions, reconstitutions, requalifications en quartier conventionné NPNRU. Validation FAT avant engagement.",
 url:"https://www.anru.fr",
 el:o=>o.qpv==1?{s:'ok',r:"Opération en QPV/NPNRU : vérifier la convention de quartier et les FAT."}:{s:'no',r:"Hors quartier conventionné."},
 sub:[5000,30000],
 jalons:o=>[
  {date:addM(o.dDepot,-3), label:"Fiche analytique et technique (FAT) à faire valider par l'ANRU", type:'action'},
  {date:o.dOS, label:"Limite : pas d'engagement avant validation (sauf autorisation anticipée)", type:'limite'}]},

{id:'region', nom:"Aides Région Île-de-France (réno du parc social)", fin:"Région ÎdF", cat:"Subvention",
 verifiedAt:"2026-07-20", cumul:"Écrêtement possible selon taux d'aides publiques total.",
 desc:"Dispositifs régionaux successifs de soutien à la rénovation énergétique du parc social — vérifier le guichet en vigueur.",
 url:"https://www.iledefrance.fr/aides-appels-a-projets",
 el:o=>o.idf&&o.type==='rehab'?{s:'maybe',r:"Guichets à fenêtres : vérifier l'appel à projets en cours et ses dates."}:{s:'no',r:"Réhab francilienne uniquement."},
 sub:[1000,4000],
 jalons:o=>[
  {date:addM(o.dDepot,-2), label:"Vérifier la fenêtre de l'AAP régional en vigueur (mesdemarches/iledefrance.fr)", type:'action'},
  {date:o.dOS, label:"Limite usuelle : dépôt avant démarrage des travaux", type:'limite'}]},

{id:'local', nom:"Subventions locales (Ville, EPT, Métropole du Grand Paris)", fin:"Collectivités", cat:"Subvention",
 verifiedAt:"2026-07-20", cumul:"Souvent en contrepartie de réservations locatives.",
 desc:"Aides sur délibération — à négocier tôt (calendrier des conseils municipaux).",
 url:"https://aides-territoires.beta.gouv.fr",
 el:o=>({s:'maybe',r:"Toujours à explorer — dépend des délibérations locales."}),
 sub:[500,5000],
 jalons:o=>[
  {date:addM(o.dDepot,-3), label:"Solliciter la collectivité (passage en conseil = 2-4 mois de délai)", type:'action'},
  {date:o.dDepot, label:"Délibération à obtenir avant bouclage du plan de financement", type:'info'}]},

{id:'feder', nom:"FEDER (efficacité énergétique logement social)", fin:"UE via Région (autorité de gestion)", cat:"Subvention",
 verifiedAt:"2026-07-20", cumul:"Plafond d'aides publiques UE : vérifier le taux maximal cumulé.",
 desc:"Fonds européens sur appels à projets — exigeant en justification, intéressant sur grosses réhabs performantes.",
 url:"https://www.europe-en-france.gouv.fr",
 el:o=>o.type==='rehab'&&['A','B','C'].includes(o.dpe2)?{s:'maybe',r:"Réhab performante : vérifier l'AAP FEDER régional ouvert."}:{s:'no',r:"Cible : réhabs à gain énergétique élevé."},
 sub:[1000,6000],
 jalons:o=>[
  {date:addM(o.dDepot,-2), label:"Vérifier AAP FEDER ouvert + monter dossier (lourd : anticiper)", type:'action'},
  {date:o.dOS, label:"Limite : commencement avant dépôt = inéligibilité quasi systématique", type:'limite'},
  {date:addM(o.dLiv,18), label:"Justification renforcée (contrôles UE) — archiver toutes les pièces", type:'info'}]},

{id:'chaleur', nom:"Prêt raccordement réseau de chaleur", fin:"ADEME / Banque des Territoires", cat:"Prêt bonifié",
 verifiedAt:"2026-07-20", cumul:"Cumulable Fonds chaleur (études) et Éco-PLS.",
 desc:"Prêt avantageux pour raccorder le parc social aux réseaux de chaleur (guichet à fenêtre).",
 url:"https://www.banquedesterritoires.fr",
 el:o=>o.rdc==1?{s:'ok',r:"Réseau à proximité : coupler raccordement et réhab (synergie DPE)."}:{s:'no',r:"Pas de réseau de chaleur à proximité déclaré."},
 pret:[1000,4000],
 jalons:o=>[
  {date:o.dDepot, label:"Dossier de raccordement + prêt (vérifier fenêtre du guichet)", type:'action'},
  {date:o.dOS, label:"Coordonner travaux de raccordement avec le phasage chantier", type:'info'}]},

{id:'al', nom:"Financements Action Logement", fin:"Action Logement", cat:"Subvention/prêt ↔ réservations",
 verifiedAt:"2026-07-20", cumul:"Contrepartie : réservations locatives. Enveloppes selon convention quinquennale.",
 desc:"Subventions et prêts contre réservations — enveloppes selon conventions en vigueur.",
 url:"https://www.actionlogement.fr",
 el:o=>(o.type==='neuf'||o.type==='acqam'||o.type==='demol')?{s:'maybe',r:"Selon enveloppes en vigueur — contrepartie : réservations."}:{s:'maybe',r:"En réhab : dispositifs ciblés selon conventions — à vérifier."},
 sub:[0,8000],
 jalons:o=>[{date:o.dDepot, label:"Solliciter Action Logement au montage (négociation réservations)", type:'action'}]},

{id:'fondschaleur', nom:"Fonds chaleur ADEME (géothermie, solaire thermique)", fin:"ADEME", cat:"Subvention",
 verifiedAt:"2026-07-20", cumul:"Cumulable avec le prêt raccordement ; études subventionnables séparément.",
 desc:"Si le projet intègre une production EnR thermique — subventions études + investissement.",
 url:"https://fondschaleur.ademe.fr",
 el:o=>({s:'maybe',r:"À étudier si géothermie/solaire thermique au programme."}),
 sub:[0,3000],
 jalons:o=>[{date:addM(o.dDepot,-1), label:"Étude de faisabilité EnR (subventionnable) avant choix système", type:'action'}]}
]};
})();
