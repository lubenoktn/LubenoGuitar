# LubenoGuitar – Manual

## Introduction {#intro}

LubenoGuitar is a practice app for guitarists. It shows a scale on the fretboard, plays a backing track for a chord progression and generates a melody with tablature for it. It also has a quiz and a tuner.

Nothing is installed or sent to a server; everything runs in the browser (Chrome, Safari, Edge, Firefox). Sound starts only after your first click on a button or a note, because browsers do not let a page play earlier.

### Web version and installing {#install}

The app runs at [lubenoktn.github.io/LubenoGuitar](https://lubenoktn.github.io/LubenoGuitar/). From there it can be installed as a standalone app that works offline after the first launch.

- **Android and desktop (Chrome, Edge):** an **Install** button appears in the top bar. If it does not, use the browser menu and choose Install app.
- **iPhone and iPad (Safari):** tap Share and choose Add to Home Screen.

The installed app updates itself when launched with a connection. Saved songs stay in place across updates.

The app also exists as a single file, `LubenoGuitar.html`, which you can download and open with a double click, without a connection. Songs saved in the downloaded file and on the web address are kept separately.

On a phone the top bar shrinks to one row (the buttons show only the ▶ and ♩ symbols) and the groups in the Backing tab are folded; tap a title to unfold one. Use the device buttons for volume on a phone.

## Quick start {#quickstart}

1. Open the app.
2. In the **Scales** tab pick a root note and a scale. The fretboard shows it right away; click a note to hear it.
3. Switch to the **Backing** tab and pick a preset, for example Pop / Rock.
4. Press **Play backing** in the top bar, or the space bar.
5. With every chord the fretboard switches to the scale that fits it and lights up the melody notes.
6. To solo yourself, click Melody under **Track mix** to mute it.

## Top bar {#toolbar}

The top bar controls playback and stays visible while you scroll.

| Control | What it does |
| --- | --- |
| ? | Opens this manual in the app's language. |
| EN / SK | Switches the app between Slovak and English. The button shows the language it will switch to. The choice is remembered. |
| Beat dots | Show the current beat of the bar. The first beat lights up orange, the others green. There are four in 4/4, three in 3/4 and six (eighths) in 6/8. |
| Play backing (▶) | Starts or stops the backing track with the melody. The space bar does the same. |
| Metronome (♩) | Starts the click alone, without the backing, in the meter of the selected groove. |
| BPM | Tempo from 40 to 240. The value applies once confirmed (Enter, or a click outside the field). In 6/8, BPM counts dotted quarter notes. |
| Tap | Tap the tempo: click at least twice in rhythm. A pause longer than 2 seconds starts the measurement over. |
| Volume | Overall volume. Individual tracks are set in the Track mix. Hidden on phones. |

While playing, the current chord, bar number and beat are shown above the fretboard.

## Fretboard and the Scales tab {#fretboard}

The fretboard has 17 frets and is shared by all tabs. The thinnest string is at the top, the bass string at the bottom. Click any note to hear it.

Colours of the scale notes:

- **orange** – root
- **green** – third
- **blue** – fifth
- **grey** – other notes of the scale
- faded notes do not belong to the scale

Above the fretboard you see the notes of the scale and its interval formula.

| Setting | Options |
| --- | --- |
| Root note | 12 notes; black keys are listed with both names, e.g. C# / Db. |
| Scale | 14 scales: minor and major pentatonic, blues, the seven modes (Ionian to Locrian), harmonic and melodic minor, altered, diminished. |
| Position | Whole fretboard or position 1–5. A position highlights 5 frets starting from the chosen scale degree on the lowest string and dims the rest. |
| Labels | Notes show note names, intervals or just dots. |
| Tuning | Standard, Drop D, DADGAD, half step down. Changing the tuning generates a new melody. |
| Note names | By key (F major shows Bb, E major shows F#), or always sharps, or always flats. |
| H instead of B | Central European naming: the note B is written H and the note Bb is written B. |
| Capo | No capo, or on fret 1 to 7. The fretboard, chord diagrams and tablature then count from the capo; fret zero is labelled K and the fret number. |
| Left-handed | Mirrors the fretboard and the chord diagrams. |

## The Backing tab {#backing}

In this tab you put together a chord progression of 2 to 12 bars. It plays in a loop.

### Presets {#presets}

The Presets group holds 11 ready-made progressions. Clicking a preset sets the chords of the section shown, the key, groove and tempo, and generates a new melody.

### Song sections {#sections}

A song can have up to 6 sections, for example a verse and a chorus. Each section has its own bars and its own melody; tempo, groove, key and tuning are shared.

- Click a section's letter to show and edit it.
- **+ Section** adds a copy of the section shown, **− Section** removes the section shown.
- Rename the section in the **Name** field (no spaces, 12 characters at most).
- Write the section names separated by spaces into the order field, e.g. `A A B A`.
- With **play the whole song in order** checked, the backing walks through the sections in that order and the view follows it. When unchecked, only the section shown is looped.

A preset and the degrees field change only the section shown. The loop from the Practice group is not used while the whole song plays.

### Key and degrees {#degrees}

You can write the progression in roman numerals instead of concrete chords.

1. Pick the key and the mode (major or minor).
2. Type the degrees into the field, e.g. `I V vi IV`.
3. Click **Apply degrees** or press Enter.

Changing the key in the list transposes the whole song; the degrees stay the same. Changing the mode does not change the chords, only how their degrees are labelled. The **Key −½** and **Key +½** buttons move the song by a half step. The exact notation is in [Degree notation](#degree-syntax).

### Bars and the bar editor {#bars}

Each bar shows its chord and, below it, its degree. While playing, the current bar is orange.

1. Click the bar you want to change (green outline).
2. In the editor below the diagrams pick the chord root and type.
3. If the bar should hold two chords, check **2nd chord at mid-bar** and pick it.
4. Click **Apply to bar**.

The second chord starts on beat 3 (on the 4th eighth in 6/8). **+ Bar** appends a copy of the last bar, **− Bar** removes the last bar.

### Chord diagrams {#diagrams}

Below the bars there is a shape for every chord of the section shown, in the current tuning. A circle above a string means an open string, an x a string that is not played, and the number on the right the fret the diagram starts at.

### Groove and count-in {#groove}

The groove sets the rhythm of the drums, bass and chords, and the meter; see [Grooves](#grooves). **Count-in** clicks one bar before the start.

### Practice: loop and speed-up {#practice}

- **Loop** repeats only the chosen range, for example from bar 2 to bar 3. Bars in the loop have a blue outline.
- **Speed up** adds the chosen number of BPM after every given number of laps, up to the top tempo. A lap is one pass through the whole progression, the loop or the song.

### Recommended scales {#suggest}

At the bottom of the tab each chord gets a recommended scale and alternatives; click one to show it on the fretboard. With **Fretboard follows the chord while playing** on, the fretboard switches by itself.

### Chord tones and CAGED shapes {#caged}

**Chord tones on the fretboard** marks the notes of the current chord with a white ring, even when they are not in the scale shown. Choose the whole fretboard or one of the five CAGED shapes (C, A, G, E, D), which shows the chord in a single position. Useful for practising arpeggios and for targeting chord tones at a change.

## Track mix and saving {#saving}

### Track mix {#mix}

The backing has five tracks: Drums, Bass, Chords, Melody and Click. Each has its own volume slider. Clicking a name mutes or unmutes the track; a muted track is grey and struck through.

Click is muted by default. Turn it on to hear the metronome together with the backing.

### Autosave {#autosave}

Your work is saved by itself and restored when you open the app again: song sections, chords, melodies, tempo, groove, key, tuning, the scale on the fretboard, the mix, the language and note naming.

### Saved progressions {#slots}

1. Type a name and click **Save**. Without a name, the song currently selected in the list is overwritten.
2. **Load** restores the song selected in the list with all its sections, melodies, tempo, groove and tuning.
3. **Delete** removes the selected song for good.

Everything is saved only in the browser you use the app in. Another browser, device or address will not see your saved songs, and clearing the browser's data removes them. Use a share link to move a song.

### Share link {#share}

**Share link** packs the whole song (sections, chords, melodies, tempo, groove, tuning) into a link and copies it to the clipboard. The link also appears in the field next to the button.

In the web version, opening the link loads the song by itself. In the downloaded file, paste the link into the field next to the button and click **Open link**.

## Melody and tablature {#melody}

The app generates a single-line melody for each section. On strong beats it aims at chord tones, and it stays within reach of the hand.

| Style | Where its notes come from |
| --- | --- |
| Pentatonic | Minor or major pentatonic, depending on the chord. |
| Lyrical line | The scale recommended for the chord; every second bar repeats the motif of the bar before. |
| Blues | The blues scale, with bends. |

Next to the style is the **melody sound**: acoustic guitar, muted guitar, clean electric, overdriven electric, flute and electric piano. A sample note plays when you change it. The sound is saved with the song and also sets the melody instrument in the MIDI export.

- **New melody** generates a different melody for the section shown, in the same style.
- **Lock** keeps the melody in bars that did not change when you edit a chord or add a bar. Without the lock the whole melody is generated again on every change.
- **Save tab (.txt)** downloads the tablature of all sections as a text file.
- **Save MIDI (.mid)** downloads a MIDI file with four tracks: melody, chords, bass and drums. With whole-song playback on it holds the whole song, otherwise the section shown. Bends and slides are not carried over to MIDI.

### Editing the melody {#edit}

You can rewrite the melody note by note.

1. Click **Edit melody**. The melody lock turns on by itself so your edits are not lost when a chord changes.
2. Click the spot in the tablature you want to change. The cursor is orange.
3. Click a note on the fretboard; it is written in and the cursor moves one eighth on. Or type the fret number on the keyboard (two digits in quick succession make fret 10 and above).
4. Arrow keys move the cursor; Delete or **Delete note** removes the note.
5. For the selected note you can set a technique (hammer-on, pull-off, slide, bend) and make it a long note of two eighths.

The **↶ Undo** button (or Ctrl+Z, Cmd+Z on a Mac) takes back the last melody edit, and also a click on New melody, up to 50 steps. After a change of tuning, capo, meter or the number of bars, older steps can no longer be undone.

Changing the style, tuning, capo or key generates the melody again and overwrites your edits. Save the song first if you want to keep them.

### Reading the tablature {#tab}

Each bar is a block of six lines; the top line is the thinnest string. A number is a fret and one column is one eighth note. While playing, the current bar is outlined.

| Mark | Meaning |
| --- | --- |
| h | hammer-on: tap onto a higher fret without picking |
| p | pull-off: pull off to a lower fret |
| `/` and `\` | slide up and down |
| b | bend the string a whole step |
| three numbers close together | triplet: three notes on one beat |

## Quiz {#quiz}

The quiz trains finding your way around the fretboard. The fretboard has no labels during it, and frets 0 to 12 are in play.

| Type | Task |
| --- | --- |
| Find the note | Click every place where the given note is. Correct places turn green; a wrong click counts as a mistake. |
| Name the interval | Two notes sound, the orange one (1) and the white one (?). Pick the interval between them from four options. |

After a correct answer the next question comes by itself. **Next question** skips the current one. The score lasts until you close the page.

## Tuner {#tuner}

The tuner listens to the guitar through the microphone and shows the nearest note and the deviation in cents.

1. Open the **Tuner** tab and click **Turn microphone on**. The browser asks for permission.
2. Play a single string.
3. A pointer left of centre means the string is flat and needs tightening; right of centre it is sharp and needs loosening.
4. Within 5 cents the note turns green and "in tune" is shown.

Below the pointer are the strings of the selected tuning; the one whose note is sounding is highlighted. Click a string to hear its reference pitch. The microphone turns off when you leave the tab.

## Reference tables {#reference}

### Grooves {#grooves}

| Groove | Meter | Character |
| --- | --- | --- |
| Rock / Pop | 4/4 | Straight eighths, chord on beats 1 and 3. |
| Funk | 4/4 | Sixteenth-note hi-hat, short syncopated chords. |
| Jazz swing | 4/4 | Swung eighths, walking bass. |
| Ballad | 4/4 | Sparse backing, one chord per bar. |
| Shuffle | 4/4 | Swung eighths with accents on beats 2 and 4; good for blues. |
| Bossa nova | 4/4 | Straight eighths, syncopated bass and rim. |
| Reggae | 4/4 | Short chords on beats 2 and 4, kick on beat 3. |
| Waltz | 3/4 | Bass on beat one, chords on beats two and three. |
| 6/8 ballad | 6/8 | Broken chords in eighths. |

### Chord types {#chords}

| Type | Example | Recommended scale |
| --- | --- | --- |
| major, maj7, sus4 | C, Cmaj7, Csus4 | Ionian |
| m, m7, m9 | Cm, Cm7, Cm9 | Dorian |
| 7, 9, 13 | C7, C9, C13 | Mixolydian |
| 7alt | C7alt | altered |
| m7b5 | Cm7b5 | Locrian |
| dim7 | Cdim7 | diminished (whole–half) |

### Degree notation {#degree-syntax}

| Notation | Meaning | Example in C major |
| --- | --- | --- |
| uppercase | major chord | `IV` = F |
| lowercase | minor chord | `vi` = Am |
| `b` or `#` before the degree | lowered or raised degree | `bVII` = Bb |
| suffix `7`, `9` | seventh chord, ninth chord | `V7` = G7, `ii7` = Dm7 |
| suffixes `maj7`, `13`, `sus4`, `7alt` | with uppercase only | `Imaj7` = Cmaj7 |
| `ø` or `m7b5` | half-diminished chord | `viiø` = Bm7b5 |
| `°` or `dim` | diminished seventh chord | `vii°` = Bdim7 |
| space | new bar | `I V vi IV` = 4 bars |
| comma | two chords in one bar | `I,V` = C and G in one bar |

In a minor key the degrees count from the natural minor scale: in A minor, `i` = Am, `VII` = G, `VI` = F.

## Tips and troubleshooting {#tips}

### Practice tips {#practice-tips}

- **Soloing over the backing:** mute the Melody track, keep chord following on and play the notes the fretboard shows.
- **One position:** choose Position 1 to 5 in the Scales tab. After a click on New melody the melody stays mostly inside it.
- **Learning a melody:** lock the melody, lower the tempo and play from the tablature. Turn on speed-up in the Practice group and the tempo rises by itself.
- **A hard spot:** loop only the bars that give you trouble.
- **Rhythm:** start the Metronome alone, or turn on the Click track and mute Drums.
- **Chords:** mute the Chords track and play the shapes from the diagrams yourself.
- **Another key:** change the key in the list; the song is transposed and the degrees stay.

### Troubleshooting {#troubleshooting}

| Problem | Fix |
| --- | --- |
| No sound | Click a note or Play backing; sound starts only after the first click. Check the volume and that tracks in the mix are not muted. On an iPhone also check the silent switch. |
| The tuner does not react | Allow the page to use the microphone and stop the backing. In the downloaded file some browsers refuse the microphone; use the web version. |
| The backing stutters | Keep the app's tab in the foreground. Browsers slow down background tabs. |
| The state was not restored | Saving does not work in a private window or with site data blocked. Saved data is separate for each browser and address. |
| The app on the phone shows an old version | Close it completely and launch it again with an internet connection. |
| "Unknown degree" | Check the notation: roman numerals I to VII only, all uppercase or all lowercase, bars separated by spaces. |
| The space bar does not start playback | The cursor is in a text field or a list. Click an empty spot on the page. |
