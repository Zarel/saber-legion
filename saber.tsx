
class SaberState {
	roundNum = "1";
	p1 = {
		match: 0,
		score: 0,
		name: "Blue",
	};
	p2 = {
		match: 0,
		score: 0,
		name: "Red",
	};
	simul = 0;

	suddenDeath = false;
	/** Time left as of the last time we resumed */
	currentDuration = 5 * 60 * 1000;
	/** null = paused, otherwise: the last time we hit start/resume */
	startTime: number | null = null;

	settings = {
		duration: 5 * 60 * 1000,
		suddenDeath: false,
		tiebreakerDuration: 30 * 1000,
		pauseAfterScoring: false,
		maxMatches: 0,
		simulCutoff: 3,
	};

	ui = {
		menuOpen: null as 'time' | 'round' | null,
		bigDisplayMode: false,
	};

	subscription: (() => void) | null = null;

	constructor() {
		this.windowDidUpdateStorage();
		window.addEventListener('storage', () => {
			this.windowDidUpdateStorage();
		});
	}
	windowDidUpdateStorage() {
		const nextStateString = localStorage.getItem('saber_state');
		if (!nextStateString || nextStateString === JSON.stringify(this.toJSON())) return;
		this.deserialize(JSON.parse(nextStateString));
	}

	timeLeft() {
		const elapsedTime = this.startTime ? (Date.now() - this.startTime) : 0;
		return Math.max(this.currentDuration - elapsedTime, 0);
	}
	pause() {
		if (!this.startTime) return false;
		this.currentDuration = this.timeLeft();
		this.startTime = null;
		this.update();
		return true;
	}
	resume() {
		if (this.startTime) return;
		this.startTime = Date.now();
		this.update();
	}
	subscribe(sub: Exclude<SaberState['subscription'], null>) {
		this.subscription = sub;
	}
	scored() {
		if (Saber.suddenDeath && this.p1.score !== this.p2.score) {
			this.currentDuration = 0;
		}
		(this.settings.pauseAfterScoring && this.pause()) || this.update();
	}
	update() {
		this.save();
		this.subscription?.();
	}
	winner() {
		if (this.p1.score > this.p2.score) return this.p1;
		if (this.p2.score > this.p1.score) return this.p2;
		return null;
	}
	nextRound() {
		if (this.timeLeft()) return;

		const winner = this.winner();

		if (winner || this.suddenDeath) {
			if (winner) winner.match++;
			const nextRound = parseInt(this.roundNum) + 1;
			if (nextRound > 0) this.roundNum = `${nextRound}`;
			this.resetRound();
		} else {
			this.currentDuration = this.settings.tiebreakerDuration;
			this.suddenDeath = true;
			this.startTime = 0;
			this.update();
		}
	}
	resetRound() {
		this.p1.score = 0;
		this.p2.score = 0;
		this.simul = 0;
		this.currentDuration = this.settings.duration;
		this.suddenDeath = false;
		this.startTime = 0;
		this.update();
	}

	toJSON() {
		return {
			roundNum: this.roundNum,
			p1: this.p1,
			p2: this.p2,
			simul: this.simul,
			currentDuration: this.currentDuration,
			startTime: this.startTime,
			suddenDeath: this.suddenDeath,
			settings: this.settings,
		};
	}
	save() {
		localStorage.setItem('saber_state', JSON.stringify(this.toJSON()));
	}
	deserialize(data: MainState) {
		if ('score1' in data) {
			// old format
			return;
		}
		this.roundNum = data.roundNum;
		this.p1 = data.p1;
		this.p2 = data.p2;
		this.simul = data.simul;
		this.currentDuration = data.currentDuration;
		this.startTime = data.startTime;
		this.suddenDeath = data.suddenDeath;
		Object.assign(this.settings, data.settings);
		this.update();
	}
};
const Saber = new SaberState();
type MainState = ReturnType<SaberState['toJSON']>;

class TimeLeft extends preact.Component {
	timer: number | null = null;
	override componentDidMount() {
		this.timer = requestAnimationFrame(this.manualUpdate);
	}
	override componentWillUnmount() {
		if (this.timer !== null) {
			clearInterval(this.timer);
			this.timer = null;
		}
	}
	manualUpdate = () => {
		this.forceUpdate();
		this.timer = null;
		if (Saber.startTime) {
			if (!Saber.timeLeft()) {
				Saber.update();
				return;
			}
			this.timer = requestAnimationFrame(this.manualUpdate);
		}
	}
	override componentDidUpdate() {
		if (this.timer === null && Saber.startTime) {
			this.timer = requestAnimationFrame(this.manualUpdate);
		}
	}
	override render() {
		let msLeft = Saber.timeLeft();
		if (msLeft <= 0) return <strong>TIME UP</strong>;
		let cs = `${Math.floor(msLeft / 10) % 100}`.padStart(2, '0');
		let s = `${Math.floor(msLeft / 1000) % 60}`.padStart(2, '0');
		let m = Math.floor(msLeft / (1000 * 60));
		return <strong>{m}:{s}<small>.{cs}</small></strong>;
	}
}

class TimeEditor extends preact.Component {
	duration = this.textTime(Saber.timeLeft());
	settingDuration = this.textTime(Saber.settings.duration);
	textTime(ms: number) {
		let s = Math.trunc(ms / 1000);
		ms = ms % 1000;
		let m = Math.trunc(s / 60);
		s = s % 60;

		const sDisplay = `${s}`.padStart(2, '0');
		const msDisplay = ms ? `.${ms}`.padStart(3, '0') : ``;
		return `${m}:${sDisplay}${msDisplay}`;
	}
	parseTextTime(str: string) {
		const result = /^(?:([0-9]+)\:)?([0-9]+)(?:\.([0-9]+))?$/.exec(str.trim());
		if (!result) return null;
		const [, minStr, secStr, msStr] = result;
		const minutes = parseInt(minStr || '0', 10);
		const seconds = parseInt(secStr, 10);
		const ms = parseInt((msStr || '0').slice(0, 3).padEnd(3, '0'), 10);
		return (minutes * 60 + seconds) * 1000 + ms;
	}
	changeTime = (e: Event) => {
		e.preventDefault();
		const durationText = (document.getElementById('time') as HTMLInputElement).value;
		const settingDurationText = (document.getElementById('timeall') as HTMLInputElement).value;
		const duration = this.parseTextTime(durationText);
		const settingDuration = this.parseTextTime(settingDurationText);
		if (!duration && duration !== 0) {
			alert(`Time "${durationText}" must be in the format:\n[minutes]:[seconds].[milliseconds]\n(minutes/milliseconds optional)`);
			return;
		}
		if (!settingDuration) {
			alert(`Time "${settingDurationText}" must be nonzero and in the format:\n[minutes]:[seconds].[milliseconds]\n(minutes/milliseconds optional)`);
			return;
		}
		Saber.currentDuration = duration;
		Saber.suddenDeath = !!(document.getElementById('suddendeath') as HTMLInputElement).checked;
		Saber.settings.duration = settingDuration;
		Saber.settings.suddenDeath = !!(document.getElementById('suddendeathall') as HTMLInputElement).checked;
		this.close();
	};
	inputTime = (e: Event) => {
		this.duration = (document.getElementById('time') as HTMLInputElement).value;
		this.settingDuration = (document.getElementById('timeall') as HTMLInputElement).value;
	};
	close = () => {
		Saber.ui.menuOpen = null;
		Saber.update();
	};
	override render() {
		return <form onSubmit={this.changeTime}>
			<p>Time left for this round?</p>
			<input type="text" class="textbox" id="time" value={this.duration} onInput={this.inputTime} />
			<div><label><input type="checkbox" id="suddendeath" checked={Saber.suddenDeath} /> Sudden death</label></div>
			<p>Time left for future rounds?</p>
			<input type="text" class="textbox" id="timeall" value={this.settingDuration} onInput={this.inputTime} />
			<div><label><input type="checkbox" id="suddendeathall" checked={Saber.settings.suddenDeath} /> Sudden death</label></div>
			<p>
				<button class="button bigbutton" type="submit"><strong>Set time</strong></button><br />
				<button class="button" type="button" onClick={this.close}>Cancel</button>
			</p>
		</form>;
	}
}

class RoundEditor extends preact.Component {
	close = () => {
		Saber.ui.menuOpen = null;
		Saber.update();
	};
	changeRound = (e: Event) => {
		Saber.roundNum = (e.target as HTMLInputElement).value;
		Saber.update();
	};
	name1 = `${Saber.p1.name}`;
	changeName1 = (e: Event) => {
		this.name1 = (e.target as HTMLInputElement).value;
		Saber.p1.name = this.name1;
		Saber.update();
	};
	name2 = `${Saber.p2.name}`;
	changeName2 = (e: Event) => {
		this.name2 = (e.target as HTMLInputElement).value;
		Saber.p2.name = this.name2;
		Saber.update();
	};
	match1 = `${Saber.p1.match}`;
	changeMatch1 = (e: Event) => {
		this.match1 = (e.target as HTMLInputElement).value;
		const match1 = parseInt(this.match1 || '0');
		Saber.p1.match = match1;
		Saber.update();
	};
	match2 = `${Saber.p2.match}`;
	changeMatch2 = (e: Event) => {
		this.match2 = (e.target as HTMLInputElement).value;
		const match2 = parseInt(this.match2 || '0');
		Saber.p2.match = match2;
		Saber.update();
	};
	maxMatches = `${Saber.settings.maxMatches || ''}`;
	changeMaxMatches = (e: Event) => {
		this.maxMatches = (e.target as HTMLInputElement).value;
		const maxMatches = parseInt(this.maxMatches || '0');
		if (!isNaN(maxMatches)) Saber.settings.maxMatches = maxMatches;
		Saber.update();
	};
	simulCutoff = `${Saber.settings.simulCutoff === Infinity ? '' : Saber.settings.simulCutoff}`;
	changeSimulCutoff = (e: Event) => {
		this.simulCutoff = (e.target as HTMLInputElement).value;
		const simulCutoff = parseInt(this.simulCutoff || 'Infinity');
		if (!isNaN(simulCutoff)) {
			Saber.settings.simulCutoff = simulCutoff;
		} else {
			Saber.settings.simulCutoff = Infinity;
		}
		Saber.update();
	};
	changePauseAfterScoring = (e: Event) => {
		Saber.settings.pauseAfterScoring = !!(e.target as HTMLInputElement).checked;
		Saber.update();
	};
	reset = () => {
		Saber.resetRound();
	};
	override render() {
		const scored = !!(Saber.p1.score || Saber.p2.score || Saber.simul);
		const started = Saber.startTime || Saber.currentDuration !== Saber.settings.duration;
		return <form onSubmit={this.close}>
			<button class="button bigbutton" disabled={!scored && !started} onClick={this.reset}>Reset round</button><br />

			<div>
				<p><strong>Current match</strong></p>
				<div><label>Round number: <input type="number" class="textbox" value={Saber.roundNum} onChange={this.changeRound} onInput={this.changeRound} /></label></div>
				<table><tr><td>
					<div><label>Left name: <br /><input type="text" class="textbox" value={Saber.p1.name} onChange={this.changeName1} onInput={this.changeName1} /></label></div>
					<div><label>Match point: <br /><input type="number" class="textbox" value={Saber.p1.match} onChange={this.changeMatch1} onInput={this.changeMatch1} /></label></div>
				</td><td>
					<div><label>Right name: <br /><input type="text" class="textbox" value={Saber.p2.name} onChange={this.changeName2} onInput={this.changeName2} /></label></div>
					<div><label>Match point: <br /><input type="number" class="textbox" value={Saber.p2.match} onChange={this.changeMatch2} onInput={this.changeMatch2} /></label></div>
				</td></tr></table>
				<p><strong>Settings</strong></p>
				<div><label>Play to: <input type="number" class="textbox" value={this.maxMatches} onChange={this.changeMaxMatches} onInput={this.changeMaxMatches} />  matches</label></div>
				<div><label>-1 score at: <input type="number" class="textbox" value={this.simulCutoff} onChange={this.changeSimulCutoff} onInput={this.changeSimulCutoff} /> simuls</label></div>
				<div><label><input type="checkbox" checked={Saber.settings.pauseAfterScoring} onChange={this.changePauseAfterScoring} onInput={this.changePauseAfterScoring} /> Pause after scoring </label></div>
			</div>

			<button class="button" type="button" onClick={this.close}>Done</button>
		</form>;
	}
}

class Main extends preact.Component {
	override componentDidMount() {
		window.addEventListener('keydown', this.keyDown);
		Saber.subscribe(() => {
			this.forceUpdate();
		});
	}
	override render() {
		const menuOpen = Saber.ui.menuOpen;
		const timeUp = !Saber.timeLeft();
		return <div class="main" style={Saber.ui.bigDisplayMode ? {zoom: 2} : null}>
			{Saber.ui.bigDisplayMode ? null : <img src="banner.jpg" alt="The Saber Legion" style={{width: "100%"}} />}
			<div style={{textAlign: "right"}}>
				<button class="round" onClick={this.editRound}><strong>Round {Saber.roundNum}</strong></button>
				{!Saber.ui.bigDisplayMode && <button class="button rleft" onClick={this.editTime}>Time</button>}
				{!Saber.ui.bigDisplayMode && <button class="button rright" onClick={this.editRound}>Edit</button>}
			</div>
			<div class="section" style={{display: menuOpen === 'time' ? 'block' : 'none'}}>
				{menuOpen === 'time' ? <TimeEditor /> : null}
			</div>
			<div class="section" style={{display: menuOpen === 'round' ? 'block' : 'none'}}>
				{menuOpen === 'round' && <RoundEditor />}
			</div>
			<button class="textbox bigtextbox" onClick={this.editTime}>
				<TimeLeft />
			</button>

			<table>
				<tr><td width="34%">
					<label class="p1 name">{Saber.p1.name}</label>
				</td><td>
					<label>&nbsp;</label>
				</td><td width="34%">
					<label class="p2 name">{Saber.p2.name}</label>
				</td></tr>
			</table>

			<table>
				<tr><td width="34%">
					<button class="score p1" onClick={this.plusScore1} onContextMenu={this.minusScore1}>
						Score:<br />
						<strong>{Saber.p1.score}</strong>
					</button>
					<label class="p1 dots">{"\u25CF ".repeat(Saber.p1.match) + "\u25CB ".repeat(Math.max(Saber.settings.maxMatches - Saber.p1.match, 0))}</label>
				</td><td>
					<button class="score" onClick={this.plusSimul} onContextMenu={this.minusSimul}>
						Simul:<br />
						<strong>{Saber.simul}</strong>
					</button>
					<div class="suddendeath">{Saber.suddenDeath && <strong>SUDDEN DEATH</strong>}</div>
				</td><td width="34%">
					<button class="score p2" onClick={this.plusScore2} onContextMenu={this.minusScore2}>
						Score:<br />
						<strong>{Saber.p2.score}</strong>
					</button>
					<label class="p2 dots">{"\u25CF ".repeat(Saber.p2.match) + "\u25CB ".repeat(Math.max(Saber.settings.maxMatches - Saber.p2.match, 0))}</label>
				</td></tr>

				{!Saber.ui.bigDisplayMode && <tr><td colSpan={3}>
					{timeUp ? 
						<button class="button verybigbutton" disabled>TIME UP</button>
					: Saber.startTime ? 
						<button class="button verybigbutton" onClick={this.startPause}>Pause</button>
					: Saber.currentDuration === Saber.settings.duration ?
						<button class="button verybigbutton" onClick={this.startPause}>Start</button>
					:
						<button class="button verybigbutton" onClick={this.startPause}>Resume</button>
					}
				</td></tr>}

				{!Saber.ui.bigDisplayMode && <tr><td>
					<button class="button bigbutton" onClick={this.plusScore1}>
						+1
					</button><br />
					<button class="button" onClick={this.minusScore1}>
						&minus;
					</button>
				</td><td>
					<button class="button bigbutton" onClick={this.plusSimul}>
						+simul
					</button><br />
					<button class="button" onClick={this.minusSimul}>
						&minus;
					</button>
				</td><td>
					<button class="button bigbutton" onClick={this.plusScore2}>
						+1
					</button><br />
					<button class="button" onClick={this.minusScore2}>
						&minus;
					</button>
				</td></tr>}

				{!Saber.ui.bigDisplayMode && <tr><td colSpan={3}>
					<p><button class="button widebutton" onClick={this.nextRound} disabled={!timeUp}>
						{Saber.winner() || Saber.suddenDeath ? "Next round" : "Tiebreaker"}
					</button></p>
					<p><button class="button widebutton" onClick={this.forceEnd} disabled={timeUp}>
						Force-end round
					</button></p>
				</td></tr>}

			</table>

			{Saber.ui.bigDisplayMode ? <div class="bottombanner"><div><img src="banner.jpg" alt="The Saber Legion" style={{width: "100%"}} /></div></div> : null}
		</div>;
	}
	keyDown = (e: KeyboardEvent) => {
		// if (['INPUT', 'BUTTON'].includes((e.target as HTMLElement).tagName)) return;
		if (['INPUT'].includes((e.target as HTMLElement).tagName)) return;
		if (e.keyCode === 70) { // F
			e.preventDefault();
			Saber.ui.bigDisplayMode = !Saber.ui.bigDisplayMode;
			Saber.update();
		} else if (e.keyCode === 32) {
			e.preventDefault();
			this.startPause();
		} else if (e.keyCode === 81) { // Q
			e.preventDefault();
			this.plusScore1(null);
		} else if (e.keyCode === 65) { // A
			e.preventDefault();
			this.minusScore1(null);
		} else if (e.keyCode === 87) { // W
			e.preventDefault();
			this.plusSimul(null);
		} else if (e.keyCode === 83) { // S
			e.preventDefault();
			this.minusSimul(null);
		} else if (e.keyCode === 69) { // E
			e.preventDefault();
			this.plusScore2(null);
		} else if (e.keyCode === 68) { // D
			e.preventDefault();
			this.minusScore2(null);
		} else if (e.keyCode === 78) { // N
			e.preventDefault();
			this.nextRound(null);
		}
	};
	editRound = () => {
		Saber.ui.menuOpen = (Saber.ui.menuOpen === 'round' ? null : 'round');
		Saber.update();
	};
	editTime = () => {
		Saber.ui.menuOpen = (Saber.ui.menuOpen === 'time' ? null : 'time');
		Saber.pause() || Saber.update();
	};
	startPause = () => {
		if (Saber.startTime) {
			Saber.pause();
		} else {
			Saber.resume();
		}
	};
	plusScore1 = (e: MouseEvent | null) => {
		e?.preventDefault();
		Saber.p1.score++;
		Saber.scored();
	};
	minusScore1 = (e: MouseEvent | null) => {
		e?.preventDefault();
		Saber.p1.score--;
		Saber.scored();
	};
	plusScore2 = (e: MouseEvent | null) => {
		e?.preventDefault();
		Saber.p2.score++;
		Saber.scored();
	};
	minusScore2 = (e: MouseEvent | null) => {
		e?.preventDefault();
		Saber.p2.score--;
		Saber.scored();
	};
	plusSimul = (e: MouseEvent | null) => {
		e?.preventDefault();
		Saber.simul++;
		const deltaScore = (Saber.simul >= Saber.settings.simulCutoff ? -1 : 0);
		Saber.p1.score += deltaScore;
		Saber.p2.score += deltaScore;
		Saber.scored();
	};
	minusSimul = (e: MouseEvent | null) => {
		e?.preventDefault();
		const deltaScore = (Saber.simul >= Saber.settings.simulCutoff ? -1 : 0);
		Saber.simul--;
		Saber.p1.score -= deltaScore;
		Saber.p2.score -= deltaScore;
		Saber.scored();
	};
	nextRound = (e: MouseEvent | null) => {
		e?.preventDefault();
		Saber.nextRound();
	};
	forceEnd = (e: MouseEvent | null) => {
		Saber.currentDuration = 0;
		Saber.update();
	};
}

preact.render(<Main />, document.body);

if (navigator.serviceWorker && !navigator.serviceWorker.controller) {
	navigator.serviceWorker.register('service-worker.js', {
		scope: './'
	}).then(reg => {
		console.log('Service worker registered: ' + reg.scope);
	});
}
