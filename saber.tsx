
const SIMUL_CUTOFF = 3;

interface MainState {
	roundNum: string;
	match1: number;
	match2: number;
	maxMatches: number;
	score1: number;
	score2: number;
	name1: string;
	name2: string;
	simul: number;
	startTime: number;
	pauseTime: number;
	pauseOffset: number;
	pauseAfterScoring: boolean;
	duration: number;
	roundDuration: number;
	menuOpen: 'time' | 'round' | null;
}

class TimeLeft extends preact.Component<{endTime: number, pausedTimeLeft?: number}> {
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
		if (this.props.pausedTimeLeft) {
			this.timer = null;
			return;
		}
		this.timer = requestAnimationFrame(this.manualUpdate);
	}
	override componentDidUpdate() {
		if (this.timer === null && !this.props.pausedTimeLeft) {
			this.timer = requestAnimationFrame(this.manualUpdate);
		}
	}
	override render() {
		// console.log("ptl:" + this.props.pausedTimeLeft);
		let msLeft = this.props.pausedTimeLeft || (this.props.endTime - Date.now());
		if (msLeft <= 0) return <strong>TIME UP</strong>;
		let cs = `${Math.floor(msLeft / 10) % 100}`.padStart(2, '0');
		let s = `${Math.floor(msLeft / 1000) % 60}`.padStart(2, '0');
		let m = Math.floor(msLeft / (1000 * 60));
		return <strong>{m}:{s}<small>.{cs}</small></strong>;
	}
}

class TimeEditor extends preact.Component<{setState: (state: Partial<MainState>) => void, state: MainState}> {
	changeTime = (e: Event) => {
		e.preventDefault();
		let minutes = Number((document.getElementById('time') as HTMLInputElement).value) || 0;
		let seconds = 60 * minutes + (Number((document.getElementById('timesec') as HTMLInputElement).value) || 0);
		if (!seconds) {
			this.setState({
				menuOpen: null,
			});
			return;
		}
		this.props.setState({
			duration: seconds * 1000,
			menuOpen: null,
		});
	};
	close = () => {
		this.props.setState({
			menuOpen: null,
		});
	};
	override render() {
		return <form onSubmit={this.changeTime}>
			<p>Time for the round?</p>
			<input type="number" class="textbox" id="time" autofocus />{"min "}
			<input type="number" class="textbox" id="timesec" placeholder="00" />sec
			<button class="button bigbutton" type="submit"><strong>Set time</strong></button><br />
			<button class="button" type="button" onClick={this.close}>Cancel</button>
		</form>;
	}
}

class RoundEditor extends preact.Component<{setState: (state: Partial<MainState>) => void, state: MainState}> {
	changeTime = (e: Event) => {
		e.preventDefault();
		let minutes = Number((document.getElementById('time') as HTMLInputElement).value) || 0;
		let seconds = 60 * minutes + (Number((document.getElementById('timesec') as HTMLInputElement).value) || 0);
		if (!seconds) {
			this.setState({
				menuOpen: null,
			});
			return;
		}
		this.props.setState({
			duration: seconds * 1000,
			menuOpen: null,
		});
	};
	close = () => {
		this.props.setState({
			menuOpen: null,
		});
	};
	changeRound = (e: Event) => {
		this.props.setState({roundNum: (e.target as HTMLInputElement).value});
	};
	changeName1 = (e: Event) => {
		this.props.setState({name1: (e.target as HTMLInputElement).value});
	};
	changeName2 = (e: Event) => {
		this.props.setState({name2: (e.target as HTMLInputElement).value});
	};
	changeMatch1 = (e: Event) => {
		this.props.setState({match1: Number((e.target as HTMLInputElement).value)});
	};
	changeMatch2 = (e: Event) => {
		this.props.setState({match2: Number((e.target as HTMLInputElement).value)});
	};
	changeMaxMatches = (e: Event) => {
		this.props.setState({maxMatches: Number((e.target as HTMLInputElement).value)});
	};
	changePauseAfterScoring = (e: Event) => {
		this.props.setState({pauseAfterScoring: !!(e.target as HTMLInputElement).checked});
	};
	reset = () => {
		this.props.setState({
			startTime: 0,
			pauseTime: 0,
			pauseOffset: 0,
			score1: 0,
			score2: 0,
			simul: 0,
			menuOpen: null,
		});
	};
	resetScores = () => {
		this.props.setState({
			score1: 0,
			score2: 0,
			simul: 0,
			menuOpen: null,
		});
	};
	resetTime = () => {
		this.props.setState({
			startTime: 0,
			pauseTime: 0,
			pauseOffset: 0,
			menuOpen: null,
		});
	};
	override render() {
		const S = this.props.state;
		const scored = !!(S.score1 || S.score2 || S.simul);
		const started = !!S.startTime;
		return <form onSubmit={this.close}>
			<button class="button bigbutton" disabled={!scored && !started} onClick={this.reset}>Reset round</button><br />
			<button class="button bigbutton" disabled={!scored} onClick={this.resetScores}>Reset scores</button><br />
			<button class="button bigbutton" disabled={!started} onClick={this.resetTime}>Reset time</button><br />

			<div>
				<p><strong>Edit match settings</strong></p>
				<div><label>Round number: <input type="number" class="textbox" value={S.roundNum} onChange={this.changeRound} onInput={this.changeRound} /></label></div>
				<div><label>Blue name: <input type="text" class="textbox" value={S.name1} onChange={this.changeName1} onInput={this.changeName1} /></label></div>
				<div><label>Blue match point: <input type="number" class="textbox" value={S.match1} onChange={this.changeMatch1} onInput={this.changeMatch1} /></label></div>
				<div><label>Red name: <input type="text" class="textbox" value={S.name2} onChange={this.changeName2} onInput={this.changeName2} /></label></div>
				<div><label>Red match point: <input type="number" class="textbox" value={S.match2} onChange={this.changeMatch2} onInput={this.changeMatch2} /></label></div>
				<div><label>Max matches: <input type="number" class="textbox" value={S.maxMatches} onChange={this.changeMaxMatches} onInput={this.changeMaxMatches} /></label></div>
				<div><label><input type="checkbox" checked={S.pauseAfterScoring} onChange={this.changePauseAfterScoring} onInput={this.changePauseAfterScoring} /> Pause after scoring </label></div>
			</div>

			<button class="button" type="button" onClick={this.close}>Done</button>
		</form>;
	}
}

class Main extends preact.Component<{}, MainState> {
	state: MainState = {
		roundNum: "1",
		match1: 0,
		match2: 0,
		maxMatches: 0,
		score1: 0,
		score2: 0,
		name1: "Blue",
		name2: "Red",
		simul: 0,
		startTime: 0,
		pauseTime: 0,
		pauseOffset: 0,
		pauseAfterScoring: false,
		duration: 5 * 60 * 1000,
		roundDuration: 5 * 60 * 1000,
		menuOpen: null,
	};
	simpleMenu = false;
	override componentDidMount() {
		this.windowDidUpdateStorage();
		window.addEventListener('storage', () => {
			this.windowDidUpdateStorage();
		});
		window.addEventListener('keydown', this.keyDown);
	}
	override componentWillUpdate(nextProps: any, nextState: any) {
		const nextStateString = JSON.stringify(nextState);
		if (nextStateString === JSON.stringify(this.state)) return;
		localStorage.setItem('saber_state', nextStateString);
	}
	windowDidUpdateStorage() {
		const nextStateString = localStorage.getItem('saber_state');
		if (!nextStateString || nextStateString === JSON.stringify(this.state)) return;
		this.setState(JSON.parse(nextStateString));
	}
	override componentDidUpdate(prevProps: any, prevState: any) {
		if (this.state.menuOpen === 'time' && prevState.menuOpen !== 'time') {
			const timeElement = document.getElementById('time');
			timeElement && timeElement.focus();
		}
	}
	setStateFromChild = (state: Partial<MainState>) => {
		this.setState(state as any);
	};
	override render() {
		const S = this.state;
		const menuOpen = this.simpleMenu ? null : S.menuOpen;
		return <div class="main" style={this.simpleMenu ? {zoom: 2} : null}>
			{this.simpleMenu ? null : <img src="banner.jpg" alt="The Saber Legion" style={{width: "100%"}} />}
			{this.simpleMenu ? <div class="bottombanner"><div><img src="banner.jpg" alt="The Saber Legion" style={{width: "100%"}} /></div></div> : null}
			<div style={{textAlign: "right"}}>
				<button class="round" onClick={this.editRound}><strong>Round {S.roundNum}</strong></button>
				{!this.simpleMenu && <button class="button rleft" onClick={this.editTime}>Time</button>}
				{!this.simpleMenu && <button class="button rright" onClick={this.editRound}>Edit</button>}
			</div>
			<div class="section" style={{display: menuOpen === 'time' ? 'block' : 'none'}}>
				{menuOpen === 'time' ? <TimeEditor setState={this.setStateFromChild} state={S} /> : null}
			</div>
			<div class="section" style={{display: menuOpen === 'round' ? 'block' : 'none'}}>
				<RoundEditor setState={this.setStateFromChild} state={S} />
			</div>
			<button class="textbox bigtextbox" onClick={this.editTime}>
				<TimeLeft {...this.timeLeft()} />
			</button>

			<table>
				<tr><td width="34%">
					<label class="p1 name">{S.name1}</label>
				</td><td>
					<label>&nbsp;</label>
				</td><td width="34%">
					<label class="p2 name">{S.name2}</label>
				</td></tr>
			</table>

			<table>
				<tr><td width="34%">
					<button class="score p1" onClick={this.plusScore1} onContextMenu={this.minusScore1}>
						Score:<br />
						<strong>{S.score1}</strong>
					</button>
					<label class="p1 dots">{"\u25CF ".repeat(S.match1) + "\u25CB ".repeat(Math.max(S.maxMatches - S.match1, 0))}</label>
				</td><td>
					<button class="score" onClick={this.plusSimul} onContextMenu={this.minusSimul}>
						Simul:<br />
						<strong>{S.simul}</strong>
					</button>
				</td><td width="34%">
					<button class="score p2" onClick={this.plusScore2} onContextMenu={this.minusScore2}>
						Score:<br />
						<strong>{S.score2}</strong>
					</button>
					<label class="p2 dots">{"\u25CF ".repeat(S.match2) + "\u25CB ".repeat(Math.max(S.maxMatches - S.match2, 0))}</label>
				</td></tr>

				{!this.simpleMenu && <tr><td colSpan={3}>
					{!S.startTime ?
						<button class="button verybigbutton" onClick={this.start}>Start</button>
					: S.pauseTime ?
						<button class="button verybigbutton" onClick={this.start}>Resume</button>
					:
						<button class="button verybigbutton" onClick={this.pause}>Pause</button>
					}
				</td></tr>}

				{!this.simpleMenu && <tr><td>
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

			</table>
		</div>;
	}
	timeLeft = () => {
		const S = this.state;
		// console.log("duration:" + S.duration);
		if (!S.startTime) {
			return {
				endTime: 0,
				pausedTimeLeft: S.duration,
			};
		}
		if (S.pauseTime) {
			const elapsed = S.pauseTime - S.startTime - S.pauseOffset;
			return {
				endTime: 0,
				pausedTimeLeft: S.duration - elapsed,
			};
		}
		return {
			endTime: S.startTime + S.duration + S.pauseOffset,
		};
	}
	keyDown = (e: KeyboardEvent) => {
		// if (['INPUT', 'BUTTON'].includes((e.target as HTMLElement).tagName)) return;
		if (['INPUT'].includes((e.target as HTMLElement).tagName)) return;
		if (e.keyCode === 70) {
			e.preventDefault();
			this.simpleMenu = !this.simpleMenu;
			this.forceUpdate();
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
		}
	};
	editRound = () => {
		this.setState({
			menuOpen: this.state.menuOpen === 'round' ? null : 'round',
		});
	};
	editTime = () => {
		this.setState({
			menuOpen: this.state.menuOpen === 'time' ? null : 'time',
		});
	};
	startPause = () => {
		if (this.state.startTime && !this.state.pauseTime) {
			this.pause();
		} else {
			this.start();
		}
	};
	start = () => {
		console.log('start');
		if (this.state.pauseTime) {
			this.setState({
				pauseOffset: this.state.pauseOffset + Date.now() - this.state.pauseTime,
				pauseTime: 0,
			})
		}
		if (this.state.startTime) return;
		this.setState({
			startTime: Date.now(),
		});
	};
	pause = () => {
		console.log('pause');
		if (this.state.pauseTime) return;
		if (!this.state.startTime) return;
		this.setState({
			pauseTime: Date.now(),
		});
	};
	plusScore1 = (e: MouseEvent | null) => {
		if (e) e.preventDefault();
		this.setState({
			score1: this.state.score1 + 1,
		});
		if (this.state.pauseAfterScoring) this.pause();
	};
	minusScore1 = (e: MouseEvent | null) => {
		if (e) e.preventDefault();
		this.setState({
			score1: this.state.score1 - 1,
		});
		if (this.state.pauseAfterScoring) this.pause();
	};
	plusScore2 = (e: MouseEvent | null) => {
		if (e) e.preventDefault();
		this.setState({
			score2: this.state.score2 + 1,
		});
		if (this.state.pauseAfterScoring) this.pause();
	};
	minusScore2 = (e: MouseEvent | null) => {
		if (e) e.preventDefault();
		this.setState({
			score2: this.state.score2 - 1,
		});
		if (this.state.pauseAfterScoring) this.pause();
	};
	plusSimul = (e: MouseEvent | null) => {
		if (e) e.preventDefault();
		let deltaScore = (this.state.simul + 1 >= SIMUL_CUTOFF ? -1 : 0);
		if (this.state.score1 <= 0 || this.state.score2 <= 0) deltaScore = 0;
		this.setState({
			simul: this.state.simul + 1,
			score1: this.state.score1 + deltaScore,
			score2: this.state.score2 + deltaScore,
		});
		if (this.state.score1 < 0) this.setState({score1: 0});
		if (this.state.score2 < 0) this.setState({score2: 0});
		if (this.state.pauseAfterScoring) this.pause();
	};
	minusSimul = (e: MouseEvent | null) => {
		if (e) e.preventDefault();
		let deltaScore = (this.state.simul + 1 > SIMUL_CUTOFF ? 1 : 0);
		this.setState({
			simul: this.state.simul - 1,
			score1: this.state.score1 + deltaScore,
			score2: this.state.score2 + deltaScore,
		});
		if (this.state.pauseAfterScoring) this.pause();
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
