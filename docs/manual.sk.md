# LubenoGuitar – manuál

## Úvod {#intro}

LubenoGuitar je cvičebná aplikácia pre gitaristov. Ukáže stupnicu na hmatníku, zahrá sprievod k akordovej postupnosti a vygeneruje k nej melódiu s tabulatúrou. Obsahuje aj kvíz a ladičku.

Nič sa neinštaluje a neposiela na server; všetko beží v prehliadači (Chrome, Safari, Edge, Firefox). Zvuk sa zapne až po prvom kliknutí na tlačidlo alebo tón, lebo prehliadače nedovolia stránke hrať skôr.

### Webová verzia a inštalácia {#install}

Aplikácia beží na adrese [lubenoktn.github.io/LubenoGuitar](https://lubenoktn.github.io/LubenoGuitar/). Dá sa z nej nainštalovať ako samostatná appka, ktorá po prvom otvorení funguje aj bez internetu.

- **Android a počítač (Chrome, Edge):** v hornej lište sa objaví tlačidlo **Inštalovať**. Ak nie, použi ponuku prehliadača a voľbu Inštalovať aplikáciu.
- **iPhone a iPad (Safari):** ťukni na Zdieľať a zvoľ Pridať na plochu.

Nainštalovaná appka sa aktualizuje sama pri spustení s pripojením. Uložené piesne pri aktualizácii ostávajú.

Aplikácia existuje aj ako jeden súbor `LubenoGuitar.html`, ktorý si môžeš stiahnuť a otvoriť dvojklikom bez internetu. Uloženia v stiahnutom súbore a na webovej adrese sú oddelené.

Na telefóne je horná lišta zhustená do jedného riadku (tlačidlá majú len symboly ▶ a ♩) a bloky v záložke Sprievod sú zbalené; rozbalíš ich ťuknutím na názov. Hlasitosť sa na telefóne ovláda tlačidlami zariadenia.

## Rýchly štart {#quickstart}

1. Otvor aplikáciu.
2. V záložke **Stupnice** vyber základný tón a stupnicu. Hmatník ju hneď zobrazí; klik na tón ho zahrá.
3. Prepni na záložku **Sprievod** a vyber niektorý preset, napríklad Pop / Rock.
4. Stlač **Spustiť sprievod** v hornej lište alebo medzerník.
5. Hmatník sa pri každom akorde prepne na stupnicu, ktorá k nemu sedí, a rozsvecuje tóny melódie.
6. Ak chceš hrať sólo sám, v časti **Mix stôp** klikni na Melódia, čím ju stlmíš.

## Horná lišta {#toolbar}

Horná lišta ovláda prehrávanie a je viditeľná stále, aj pri posúvaní stránky.

| Prvok | Čo robí |
| --- | --- |
| ? | Otvorí tento manuál v jazyku aplikácie. |
| EN / SK | Prepne jazyk aplikácie medzi slovenčinou a angličtinou. Tlačidlo ukazuje jazyk, do ktorého sa prepne. Voľba sa zapamätá. |
| Bodky dôb | Ukazujú aktuálnu dobu v takte. Prvá doba svieti oranžovo, ostatné zeleno. V 4/4 sú štyri, v 3/4 tri, v 6/8 šesť (osminy). |
| Spustiť sprievod (▶) | Spustí alebo zastaví sprievod s melódiou. To isté robí medzerník. |
| Metronóm (♩) | Spustí samotný klik bez sprievodu, v metre zvoleného groovu. |
| BPM | Tempo od 40 do 240. Hodnota sa použije po potvrdení (Enter alebo klik mimo poľa). V 6/8 znamená BPM bodkovanú štvrťku. |
| Tap | Tempo vyťukáš: klikni aspoň dvakrát v rytme. Pauza dlhšia než 2 sekundy začne meranie odznova. |
| Hlasitosť | Celková hlasitosť. Jednotlivé stopy sa nastavujú v Mixe stôp. Na telefóne je skrytá. |

Počas hrania sa nad hmatníkom zobrazuje aktuálny akord, číslo taktu a doba.

## Hmatník a záložka Stupnice {#fretboard}

Hmatník má 17 pražcov a je spoločný pre všetky záložky. Najvyššie je tenká struna, najnižšie basová. Klik na ktorýkoľvek tón ho zahrá.

Farby tónov stupnice:

- **oranžová** – základný tón (root)
- **zelená** – tercia
- **modrá** – kvinta
- **sivá** – ostatné tóny stupnice
- vyblednuté tóny do stupnice nepatria

Nad hmatníkom vidíš tóny stupnice a jej intervalový vzorec.

| Nastavenie | Možnosti |
| --- | --- |
| Základný tón | 12 tónov; čierne klávesy sú uvedené oboma názvami, napr. C# / Db. |
| Stupnica | 14 stupníc: molová a durová pentatonika, bluesová, sedem módov (jónsky až lokrický), harmonická a melodická mol, alterovaná, zmenšená. |
| Pozícia | Celý hmatník alebo pozícia 1–5. Pozícia zvýrazní 5 pražcov od zvoleného stupňa stupnice na najnižšej strune, zvyšok stlmí. |
| Značky | Na tónoch sa zobrazia názvy tónov, intervaly alebo len bodky. |
| Ladenie | Standard, Drop D, DADGAD, pol tónu dole. Zmena ladenia vygeneruje novú melódiu. |
| Názvy tónov | Podľa tóniny (F dur ukáže Bb, E dur ukáže F#), alebo vždy krížiky, alebo vždy béčka. |
| H namiesto B | Stredoeurópske názvy: tón B sa píše H a tón Bb sa píše B. |
| Kapodaster | Bez kapodastra alebo na 1. až 7. pražci. Hmatník, akordové diagramy aj tabulatúra sa potom počítajú od kapodastra; nultý pražec je označený K a číslom. |
| Pre ľavákov | Zrkadlovo otočí hmatník aj akordové diagramy. |

## Záložka Sprievod {#backing}

V tejto záložke si poskladáš akordovú postupnosť s dĺžkou 2 až 12 taktov. Hrá sa dookola.

### Presety {#presets}

Blok Presety obsahuje 11 hotových postupností. Klik na preset nastaví akordy zobrazenej časti, tóninu, groove aj tempo a vygeneruje novú melódiu.

### Časti piesne {#sections}

Pieseň môže mať až 6 častí, napríklad slohu a refrén. Každá časť má vlastné takty a vlastnú melódiu; tempo, groove, tónina a ladenie sú spoločné.

- Klik na písmeno časti ju zobrazí a umožní upravovať.
- **+ Časť** pridá kópiu zobrazenej časti, **− Časť** zobrazenú časť odstráni.
- V poli **Názov** časť premenuješ (bez medzier, najviac 12 znakov).
- Do poľa poradia napíš názvy častí oddelené medzerou, napr. `A A B A`.
- So zaškrtnutým **hrať celú pieseň v poradí** sprievod prechádza časti podľa poradia a zobrazenie sa prepína s ním. Bez zaškrtnutia sa opakuje len zobrazená časť.

Preset a zápis v stupňoch menia len zobrazenú časť. Slučka z bloku Cvičenie sa pri hraní celej piesne nepoužíva.

### Tónina a stupne {#degrees}

Postupnosť môžeš zapísať rímskymi číslicami namiesto konkrétnych akordov.

1. Vyber tóninu a tónorod (dur alebo mol).
2. Do poľa napíš stupne, napr. `I V vi IV`.
3. Klikni **Použiť stupne** alebo stlač Enter.

Zmena tóniny vo výbere celú pieseň transponuje, stupne ostanú rovnaké. Zmena tónorodu akordy nemení, len prepočíta označenie stupňov. Tlačidlá **Tónina −½** a **Tónina +½** posúvajú pieseň o poltón. Presný zápis je v časti [Zápis stupňov](#degree-syntax).

### Takty a editor taktu {#bars}

Každý takt ukazuje akord a pod ním jeho stupeň. Počas hrania je aktuálny takt oranžový.

1. Klikni na takt, ktorý chceš zmeniť (zelený rámik).
2. V editore pod diagramami vyber základný tón a typ akordu.
3. Ak majú byť v takte dva akordy, zaškrtni **2. akord v polovici taktu** a vyber ho.
4. Klikni **Použiť na takt**.

Druhý akord nastupuje na 3. dobe (v 6/8 na 4. osmine). **+ Takt** pridá na koniec kópiu posledného taktu, **− Takt** posledný takt odoberie.

### Akordové diagramy {#diagrams}

Pod taktmi je hmat pre každý akord zobrazenej časti v aktuálnom ladení. Krúžok nad strunou znamená prázdnu strunu, x strunu, ktorá sa nehrá, číslo vpravo pražec, na ktorom diagram začína.

### Groove a predtakt {#groove}

Groove určuje rytmus bicích, basy a akordov aj metrum; prehľad je v časti [Groovy](#grooves). **Predtakt** odkliká jeden takt pred začiatkom.

### Cvičenie: slučka a zrýchľovanie {#practice}

- **Slučka** opakuje len zvolený úsek, napríklad od taktu 2 po takt 3. Takty v slučke majú modrý rámik.
- **Zrýchliť** pridá zvolený počet BPM vždy po zadanom počte kôl, až po najvyššie tempo. Kolo je jedno prehranie celej postupnosti, slučky alebo piesne.

### Odporúčané stupnice {#suggest}

Na spodku záložky je ku každému akordu odporúčaná stupnica a alternatívy; klik ju zobrazí na hmatníku. Keď je zapnuté **Hmatník sleduje akord počas hrania**, prepína sa hmatník sám.

### Tóny akordu a tvary CAGED {#caged}

Výber **Tóny akordu na hmatníku** označí bielym krúžkom tóny aktuálneho akordu, aj keď do zobrazenej stupnice nepatria. Zvoliť môžeš celý hmatník alebo jeden z piatich tvarov CAGED (C, A, G, E, D), ktorý ukáže akord len v jednej polohe. Hodí sa na cvičenie arpeggií a cielenie na tóny akordu pri zmene.

## Mix stôp a ukladanie {#saving}

### Mix stôp {#mix}

Sprievod má päť stôp: Bicie, Basa, Akordy, Melódia a Klik. Každá má vlastný posuvník hlasitosti. Klik na názov stopu stlmí alebo znova zapne; stlmená stopa je sivá a prečiarknutá.

Klik je predvolene stlmený. Zapni ho, ak chceš počuť metronóm spolu so sprievodom.

### Automatické ukladanie {#autosave}

Rozpracovaný stav sa ukladá sám a po opätovnom otvorení sa obnoví: časti piesne, akordy, melódie, tempo, groove, tónina, ladenie, stupnica na hmatníku, mix, jazyk aj názvy tónov.

### Uložené postupnosti {#slots}

1. Napíš názov a klikni **Uložiť**. Bez názvu sa prepíše pieseň práve vybraná v zozname.
2. **Načítať** obnoví pieseň vybranú v zozname vrátane všetkých častí, melódií, tempa, groovu a ladenia.
3. **Zmazať** vybranú pieseň natrvalo odstráni.

Všetko sa ukladá len v prehliadači, v ktorom aplikáciu používaš. Iný prehliadač, zariadenie alebo adresa uložené piesne neuvidí a vymazanie údajov prehliadača ich odstráni. Na prenos použi zdieľanie odkazom.

### Zdieľanie odkazom {#share}

**Zdieľať odkaz** zabalí celú pieseň (časti, akordy, melódie, tempo, groove, ladenie) do odkazu a skopíruje ho do schránky. Odkaz sa zároveň zobrazí v poli vedľa tlačidla.

Vo webovej verzii stačí odkaz otvoriť a pieseň sa načíta sama. V stiahnutom súbore vlož odkaz do poľa vedľa tlačidla a klikni **Otvoriť odkaz**.

## Melódia a tabulatúra {#melody}

Ku každej časti aplikácia vygeneruje jednohlasnú melódiu. Na ťažkých dobách cieli na tóny akordu a drží sa v dosahu ruky.

| Štýl | Z čoho vyberá tóny |
| --- | --- |
| Pentatonika | Molová alebo durová pentatonika podľa akordu. |
| Spevná linka | Stupnica odporúčaná k akordu; každý druhý takt opakuje motív predošlého. |
| Blues | Bluesová stupnica s ohybmi. |

Vedľa štýlu je výber **zvuku melódie**: akustická gitara, tlmená gitara, elektrická čistá, elektrická skreslená, flauta a elektrické piano. Po zmene zaznie ukážkový tón. Zvuk sa ukladá s piesňou a určuje aj nástroj melódie v MIDI exporte.

- **Nová melódia** vygeneruje inú melódiu zobrazenej časti v tom istom štýle.
- **Zamknúť** zachová melódiu v taktoch, ktoré sa nezmenili, keď upravíš akord alebo pridáš takt. Bez zamknutia sa pri každej zmene vygeneruje celá nanovo.
- **Uložiť tabulatúru (.txt)** stiahne tabulatúru všetkých častí ako textový súbor.
- **Uložiť MIDI (.mid)** stiahne MIDI súbor so štyrmi stopami: melódia, akordy, basa a bicie. Pri zapnutom hraní celej piesne obsahuje celú pieseň, inak zobrazenú časť. Ohyby a slidy sa do MIDI neprenášajú.

### Úprava melódie {#edit}

Melódiu môžeš prepísať tón po tóne.

1. Klikni **Upraviť melódiu**. Zamknutie melódie sa zapne samo, aby sa úpravy nestratili pri zmene akordu.
2. Klikni do tabulatúry na miesto, ktoré chceš zmeniť. Kurzor je oranžový.
3. Klikni na tón na hmatníku; zapíše sa a kurzor sa posunie o osminu ďalej. Alebo napíš číslo pražca na klávesnici (dve číslice rýchlo po sebe dajú pražec 10 a vyššie).
4. Šípky posúvajú kurzor, Delete alebo **Zmazať tón** tón odstráni.
5. Pri vybranom tóne nastavíš techniku (hammer-on, pull-off, slide, ohyb) a dlhý tón na dve osminy.

Tlačidlo **↶ Späť** (alebo Ctrl+Z, na Macu Cmd+Z) vráti poslednú úpravu melódie aj kliknutie na Nová melódia, až 50 krokov dozadu. Po zmene ladenia, kapodastra, metra alebo počtu taktov sa staršie kroky už vrátiť nedajú.

Zmena štýlu, ladenia, kapodastra alebo tóniny melódiu vygeneruje nanovo a úpravy prepíše. Ak si ich chceš nechať, pieseň predtým ulož.

### Ako čítať tabulatúru {#tab}

Každý takt je samostatný blok so šiestimi riadkami, horný je najtenšia struna. Číslo je pražec a jeden stĺpec je jedna osmina. Počas hrania je aktuálny takt orámovaný.

| Značka | Význam |
| --- | --- |
| h | hammer-on: príklep na vyšší pražec bez brnknutia |
| p | pull-off: odtrh na nižší pražec |
| `/` a `\` | slide nahor a nadol |
| b | ohyb struny o celý tón |
| tri čísla tesne pri sebe | triola: tri tóny na jednu dobu |

## Kvíz {#quiz}

Kvíz precvičuje orientáciu na hmatníku. Hmatník je počas neho bez popisov a hrá sa na pražcoch 0 až 12.

| Typ | Úloha |
| --- | --- |
| Nájdi tón | Klikni na všetky miesta, kde sa zadaný tón nachádza. Správne miesta sa zafarbia nazeleno, nesprávny klik pripočíta chybu. |
| Urči interval | Zaznejú dva tóny, oranžový (1) a biely (?). Vyber zo štyroch možností interval medzi nimi. |

Po správnej odpovedi príde ďalšia otázka sama. **Ďalšia otázka** aktuálnu preskočí. Skóre platí do zatvorenia stránky.

## Ladička {#tuner}

Ladička počúva gitaru cez mikrofón a ukazuje najbližší tón a odchýlku v centoch.

1. Otvor záložku **Ladička** a klikni **Zapnúť mikrofón**. Prehliadač si vypýta povolenie.
2. Zahraj jednu strunu.
3. Ukazovateľ vľavo od stredu znamená, že struna je nízko a treba ju pritiahnuť; vpravo je vysoko a treba ju povoliť.
4. Pri odchýlke do 5 centov sa tón zafarbí nazeleno a zobrazí sa „naladené“.

Pod ukazovateľom sú struny zvoleného ladenia; tá, ktorej tón práve znie, sa zvýrazní. Klik na strunu prehrá referenčný tón. Mikrofón sa vypne po odchode zo záložky.

## Prehľadové tabuľky {#reference}

### Groovy {#grooves}

| Groove | Metrum | Charakter |
| --- | --- | --- |
| Rock / Pop | 4/4 | Rovné osminy, akord na 1. a 3. dobe. |
| Funk | 4/4 | Šestnástinové činely, krátke synkopované akordy. |
| Jazz swing | 4/4 | Swingované osminy, kráčajúca basa. |
| Balada | 4/4 | Riedky sprievod, jeden akord na takt. |
| Shuffle | 4/4 | Swingované osminy s dôrazom na 2. a 4. dobu; vhodný na blues. |
| Bossa nova | 4/4 | Rovné osminy, synkopovaná basa a rim. |
| Reggae | 4/4 | Krátke akordy na 2. a 4. dobe, bubák na 3. dobe. |
| Valčík | 3/4 | Basa na prvej dobe, akordy na druhej a tretej. |
| Balada 6/8 | 6/8 | Rozložené akordy po osminách. |

### Typy akordov {#chords}

| Typ | Príklad | Odporúčaná stupnica |
| --- | --- | --- |
| dur, maj7, sus4 | C, Cmaj7, Csus4 | jónska |
| m, m7, m9 | Cm, Cm7, Cm9 | dórska |
| 7, 9, 13 | C7, C9, C13 | mixolydická |
| 7alt | C7alt | alterovaná |
| m7b5 | Cm7b5 | lokrická |
| dim7 | Cdim7 | zmenšená (celý–pol) |

### Zápis stupňov {#degree-syntax}

| Zápis | Význam | Príklad v C dur |
| --- | --- | --- |
| veľké písmená | durový akord | `IV` = F |
| malé písmená | molový akord | `vi` = Am |
| `b` alebo `#` pred stupňom | znížený alebo zvýšený stupeň | `bVII` = Bb |
| prípona `7`, `9` | septakord, nonový akord | `V7` = G7, `ii7` = Dm7 |
| prípony `maj7`, `13`, `sus4`, `7alt` | len pri veľkých písmenách | `Imaj7` = Cmaj7 |
| `ø` alebo `m7b5` | polozmenšený akord | `viiø` = Bm7b5 |
| `°` alebo `dim` | zmenšený septakord | `vii°` = Bdim7 |
| medzera | nový takt | `I V vi IV` = 4 takty |
| čiarka | dva akordy v jednom takte | `I,V` = C a G v jednom takte |

V molovej tónine sa stupne počítajú od prirodzenej molovej stupnice: v A mol je `i` = Am, `VII` = G, `VI` = F.

## Tipy a riešenie problémov {#tips}

### Tipy na cvičenie {#practice-tips}

- **Sólo nad sprievodom:** stlm stopu Melódia, nechaj zapnuté sledovanie akordu a hraj tóny, ktoré hmatník ukazuje.
- **Jedna pozícia:** v záložke Stupnice zvoľ Pozíciu 1 až 5. Po kliknutí na Nová melódia sa melódia bude držať prevažne v nej.
- **Učenie melódie:** zamkni melódiu, zníž tempo a hraj podľa tabulatúry. Zapni zrýchľovanie v bloku Cvičenie a tempo porastie samo.
- **Ťažké miesto:** zapni slučku len na takty, ktoré ti nejdú.
- **Rytmus:** spusti samotný Metronóm, alebo zapni stopu Klik a stlm Bicie.
- **Akordy:** stlm stopu Akordy a hraj hmaty z diagramov sám.
- **Iná tónina:** zmeň tóninu vo výbere; pieseň sa transponuje a stupne ostanú.

### Riešenie problémov {#troubleshooting}

| Problém | Riešenie |
| --- | --- |
| Nič nepočuť | Klikni na tón alebo na Spustiť sprievod; zvuk sa zapína až po prvom kliknutí. Skontroluj hlasitosť a či stopy v Mixe nie sú stlmené. Na iPhone skontroluj aj prepínač tichého režimu. |
| Ladička nereaguje | Povoľ stránke prístup k mikrofónu a vypni sprievod. V stiahnutom súbore niektoré prehliadače mikrofón nepovolia; použi webovú verziu. |
| Sprievod sa zasekáva | Nechaj kartu s aplikáciou v popredí. Prehliadač karty na pozadí spomaľuje. |
| Stav sa po otvorení neobnovil | Ukladanie nefunguje v anonymnom okne a pri zakázaných údajoch stránok. Uloženia sú zvlášť pre každý prehliadač a adresu. |
| Appka v telefóne ukazuje starú verziu | Úplne ju zatvor a spusti znova s pripojením na internet. |
| „Nerozumiem stupňu“ | Skontroluj zápis: len rímske číslice I až VII, celé veľké alebo celé malé, takty oddelené medzerou. |
| Medzerník nespúšťa prehrávanie | Kurzor je v textovom poli alebo vo výbere. Klikni na prázdne miesto stránky. |
