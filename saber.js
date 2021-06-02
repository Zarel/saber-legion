"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var SIMUL_CUTOFF = 3;
var TimeLeft = /** @class */ (function (_super) {
    __extends(TimeLeft, _super);
    function TimeLeft() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.timer = null;
        _this.manualUpdate = function () {
            _this.forceUpdate();
            if (_this.props.pausedTimeLeft) {
                _this.timer = null;
                return;
            }
            _this.timer = requestAnimationFrame(_this.manualUpdate);
        };
        return _this;
    }
    TimeLeft.prototype.componentDidMount = function () {
        this.timer = requestAnimationFrame(this.manualUpdate);
    };
    TimeLeft.prototype.componentWillUnmount = function () {
        if (this.timer !== null) {
            clearInterval(this.timer);
            this.timer = null;
        }
    };
    TimeLeft.prototype.componentDidUpdate = function () {
        if (this.timer === null && !this.props.pausedTimeLeft) {
            this.timer = requestAnimationFrame(this.manualUpdate);
        }
    };
    TimeLeft.prototype.render = function () {
        // console.log("ptl:" + this.props.pausedTimeLeft);
        var msLeft = this.props.pausedTimeLeft || (this.props.endTime - Date.now());
        if (msLeft <= 0)
            return preact.h("strong", null, "TIME UP");
        var cs = ("" + Math.floor(msLeft / 10) % 100).padStart(2, '0');
        var s = ("" + Math.floor(msLeft / 1000) % 60).padStart(2, '0');
        var m = Math.floor(msLeft / (1000 * 60));
        return preact.h("strong", null,
            m,
            ":",
            s,
            preact.h("small", null,
                ".",
                cs));
    };
    return TimeLeft;
}(preact.Component));
var TimeEditor = /** @class */ (function (_super) {
    __extends(TimeEditor, _super);
    function TimeEditor() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.changeTime = function (e) {
            e.preventDefault();
            var minutes = Number(document.getElementById('time').value) || 0;
            var seconds = 60 * minutes + (Number(document.getElementById('timesec').value) || 0);
            if (!seconds) {
                _this.setState({
                    menuOpen: null,
                });
                return;
            }
            _this.props.setState({
                duration: seconds * 1000,
                menuOpen: null,
            });
        };
        _this.close = function () {
            _this.props.setState({
                menuOpen: null,
            });
        };
        return _this;
    }
    TimeEditor.prototype.render = function () {
        return preact.h("form", { onSubmit: this.changeTime },
            preact.h("p", null, "Time for the round?"),
            preact.h("input", { type: "number", class: "textbox", id: "time", autofocus: true }),
            "min ",
            preact.h("input", { type: "number", class: "textbox", id: "timesec", placeholder: "00" }),
            "sec",
            preact.h("button", { class: "button bigbutton", type: "submit" },
                preact.h("strong", null, "Set time")),
            preact.h("br", null),
            preact.h("button", { class: "button", type: "button", onClick: this.close }, "Cancel"));
    };
    return TimeEditor;
}(preact.Component));
var RoundEditor = /** @class */ (function (_super) {
    __extends(RoundEditor, _super);
    function RoundEditor() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.changeTime = function (e) {
            e.preventDefault();
            var minutes = Number(document.getElementById('time').value) || 0;
            var seconds = 60 * minutes + (Number(document.getElementById('timesec').value) || 0);
            if (!seconds) {
                _this.setState({
                    menuOpen: null,
                });
                return;
            }
            _this.props.setState({
                duration: seconds * 1000,
                menuOpen: null,
            });
        };
        _this.close = function () {
            _this.props.setState({
                menuOpen: null,
            });
        };
        _this.changeRound = function (e) {
            _this.props.setState({ roundNum: e.target.value });
        };
        _this.changeName1 = function (e) {
            _this.props.setState({ name1: e.target.value });
        };
        _this.changeName2 = function (e) {
            _this.props.setState({ name2: e.target.value });
        };
        _this.changeMatch1 = function (e) {
            _this.props.setState({ match1: Number(e.target.value) });
        };
        _this.changeMatch2 = function (e) {
            _this.props.setState({ match2: Number(e.target.value) });
        };
        _this.changeMaxMatches = function (e) {
            _this.props.setState({ maxMatches: Number(e.target.value) });
        };
        _this.changePauseAfterScoring = function (e) {
            _this.props.setState({ pauseAfterScoring: !!e.target.checked });
        };
        _this.reset = function () {
            _this.props.setState({
                startTime: 0,
                pauseTime: 0,
                pauseOffset: 0,
                score1: 0,
                score2: 0,
                simul: 0,
                menuOpen: null,
            });
        };
        _this.resetScores = function () {
            _this.props.setState({
                score1: 0,
                score2: 0,
                simul: 0,
                menuOpen: null,
            });
        };
        _this.resetTime = function () {
            _this.props.setState({
                startTime: 0,
                pauseTime: 0,
                pauseOffset: 0,
                menuOpen: null,
            });
        };
        return _this;
    }
    RoundEditor.prototype.render = function () {
        var S = this.props.state;
        var scored = !!(S.score1 || S.score2 || S.simul);
        var started = !!S.startTime;
        return preact.h("form", { onSubmit: this.close },
            preact.h("button", { class: "button bigbutton", disabled: !scored && !started, onClick: this.reset }, "Reset round"),
            preact.h("br", null),
            preact.h("button", { class: "button bigbutton", disabled: !scored, onClick: this.resetScores }, "Reset scores"),
            preact.h("br", null),
            preact.h("button", { class: "button bigbutton", disabled: !started, onClick: this.resetTime }, "Reset time"),
            preact.h("br", null),
            preact.h("div", null,
                preact.h("p", null,
                    preact.h("strong", null, "Edit match settings")),
                preact.h("div", null,
                    preact.h("label", null,
                        "Round number: ",
                        preact.h("input", { type: "number", class: "textbox", value: S.roundNum, onChange: this.changeRound, onInput: this.changeRound }))),
                preact.h("div", null,
                    preact.h("label", null,
                        "Blue name: ",
                        preact.h("input", { type: "text", class: "textbox", value: S.name1, onChange: this.changeName1, onInput: this.changeName1 }))),
                preact.h("div", null,
                    preact.h("label", null,
                        "Blue match point: ",
                        preact.h("input", { type: "number", class: "textbox", value: S.match1, onChange: this.changeMatch1, onInput: this.changeMatch1 }))),
                preact.h("div", null,
                    preact.h("label", null,
                        "Red name: ",
                        preact.h("input", { type: "text", class: "textbox", value: S.name2, onChange: this.changeName2, onInput: this.changeName2 }))),
                preact.h("div", null,
                    preact.h("label", null,
                        "Red match point: ",
                        preact.h("input", { type: "number", class: "textbox", value: S.match2, onChange: this.changeMatch2, onInput: this.changeMatch2 }))),
                preact.h("div", null,
                    preact.h("label", null,
                        "Max matches: ",
                        preact.h("input", { type: "number", class: "textbox", value: S.maxMatches, onChange: this.changeMaxMatches, onInput: this.changeMaxMatches }))),
                preact.h("div", null,
                    preact.h("label", null,
                        preact.h("input", { type: "checkbox", checked: S.pauseAfterScoring, onChange: this.changePauseAfterScoring, onInput: this.changePauseAfterScoring }),
                        " Pause after scoring "))),
            preact.h("button", { class: "button", type: "button", onClick: this.close }, "Done"));
    };
    return RoundEditor;
}(preact.Component));
var Main = /** @class */ (function (_super) {
    __extends(Main, _super);
    function Main() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.state = {
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
        _this.simpleMenu = false;
        _this.setStateFromChild = function (state) {
            _this.setState(state);
        };
        _this.timeLeft = function () {
            var S = _this.state;
            // console.log("duration:" + S.duration);
            if (!S.startTime) {
                return {
                    endTime: 0,
                    pausedTimeLeft: S.duration,
                };
            }
            if (S.pauseTime) {
                var elapsed = S.pauseTime - S.startTime - S.pauseOffset;
                return {
                    endTime: 0,
                    pausedTimeLeft: S.duration - elapsed,
                };
            }
            return {
                endTime: S.startTime + S.duration + S.pauseOffset,
            };
        };
        _this.keyDown = function (e) {
            // if (['INPUT', 'BUTTON'].includes((e.target as HTMLElement).tagName)) return;
            if (['INPUT'].includes(e.target.tagName))
                return;
            if (e.keyCode === 70) {
                e.preventDefault();
                _this.simpleMenu = !_this.simpleMenu;
                _this.forceUpdate();
            }
            else if (e.keyCode === 32) {
                e.preventDefault();
                _this.startPause();
            }
            else if (e.keyCode === 81) { // Q
                e.preventDefault();
                _this.plusScore1(null);
            }
            else if (e.keyCode === 65) { // A
                e.preventDefault();
                _this.minusScore1(null);
            }
            else if (e.keyCode === 87) { // W
                e.preventDefault();
                _this.plusSimul(null);
            }
            else if (e.keyCode === 83) { // S
                e.preventDefault();
                _this.minusSimul(null);
            }
            else if (e.keyCode === 69) { // E
                e.preventDefault();
                _this.plusScore2(null);
            }
            else if (e.keyCode === 68) { // D
                e.preventDefault();
                _this.minusScore2(null);
            }
        };
        _this.editRound = function () {
            _this.setState({
                menuOpen: _this.state.menuOpen === 'round' ? null : 'round',
            });
        };
        _this.editTime = function () {
            _this.setState({
                menuOpen: _this.state.menuOpen === 'time' ? null : 'time',
            });
        };
        _this.startPause = function () {
            if (_this.state.startTime && !_this.state.pauseTime) {
                _this.pause();
            }
            else {
                _this.start();
            }
        };
        _this.start = function () {
            console.log('start');
            if (_this.state.pauseTime) {
                _this.setState({
                    pauseOffset: _this.state.pauseOffset + Date.now() - _this.state.pauseTime,
                    pauseTime: 0,
                });
            }
            if (_this.state.startTime)
                return;
            _this.setState({
                startTime: Date.now(),
            });
        };
        _this.pause = function () {
            console.log('pause');
            if (_this.state.pauseTime)
                return;
            if (!_this.state.startTime)
                return;
            _this.setState({
                pauseTime: Date.now(),
            });
        };
        _this.plusScore1 = function (e) {
            if (e)
                e.preventDefault();
            _this.setState({
                score1: _this.state.score1 + 1,
            });
            if (_this.state.pauseAfterScoring)
                _this.pause();
        };
        _this.minusScore1 = function (e) {
            if (e)
                e.preventDefault();
            _this.setState({
                score1: _this.state.score1 - 1,
            });
            if (_this.state.pauseAfterScoring)
                _this.pause();
        };
        _this.plusScore2 = function (e) {
            if (e)
                e.preventDefault();
            _this.setState({
                score2: _this.state.score2 + 1,
            });
            if (_this.state.pauseAfterScoring)
                _this.pause();
        };
        _this.minusScore2 = function (e) {
            if (e)
                e.preventDefault();
            _this.setState({
                score2: _this.state.score2 - 1,
            });
            if (_this.state.pauseAfterScoring)
                _this.pause();
        };
        _this.plusSimul = function (e) {
            if (e)
                e.preventDefault();
            var deltaScore = (_this.state.simul + 1 >= SIMUL_CUTOFF ? -1 : 0);
            if (_this.state.score1 <= 0 || _this.state.score2 <= 0)
                deltaScore = 0;
            _this.setState({
                simul: _this.state.simul + 1,
                score1: _this.state.score1 + deltaScore,
                score2: _this.state.score2 + deltaScore,
            });
            if (_this.state.score1 < 0)
                _this.setState({ score1: 0 });
            if (_this.state.score2 < 0)
                _this.setState({ score2: 0 });
            if (_this.state.pauseAfterScoring)
                _this.pause();
        };
        _this.minusSimul = function (e) {
            if (e)
                e.preventDefault();
            var deltaScore = (_this.state.simul + 1 > SIMUL_CUTOFF ? 1 : 0);
            _this.setState({
                simul: _this.state.simul - 1,
                score1: _this.state.score1 + deltaScore,
                score2: _this.state.score2 + deltaScore,
            });
            if (_this.state.pauseAfterScoring)
                _this.pause();
        };
        return _this;
    }
    Main.prototype.componentDidMount = function () {
        var _this = this;
        this.windowDidUpdateStorage();
        window.addEventListener('storage', function () {
            _this.windowDidUpdateStorage();
        });
        window.addEventListener('keydown', this.keyDown);
    };
    Main.prototype.componentWillUpdate = function (nextProps, nextState) {
        var nextStateString = JSON.stringify(nextState);
        if (nextStateString === JSON.stringify(this.state))
            return;
        localStorage.setItem('saber_state', nextStateString);
    };
    Main.prototype.windowDidUpdateStorage = function () {
        var nextStateString = localStorage.getItem('saber_state');
        if (!nextStateString || nextStateString === JSON.stringify(this.state))
            return;
        this.setState(JSON.parse(nextStateString));
    };
    Main.prototype.componentDidUpdate = function (prevProps, prevState) {
        if (this.state.menuOpen === 'time' && prevState.menuOpen !== 'time') {
            var timeElement = document.getElementById('time');
            timeElement && timeElement.focus();
        }
    };
    Main.prototype.render = function () {
        var S = this.state;
        var menuOpen = this.simpleMenu ? null : S.menuOpen;
        return preact.h("div", { class: "main", style: this.simpleMenu ? { zoom: 2 } : null },
            this.simpleMenu ? null : preact.h("img", { src: "banner.jpg", alt: "The Saber Legion", style: { width: "100%" } }),
            this.simpleMenu ? preact.h("div", { class: "bottombanner" },
                preact.h("div", null,
                    preact.h("img", { src: "banner.jpg", alt: "The Saber Legion", style: { width: "100%" } }))) : null,
            preact.h("div", { style: { textAlign: "right" } },
                preact.h("button", { class: "round", onClick: this.editRound },
                    preact.h("strong", null,
                        "Round ",
                        S.roundNum)),
                !this.simpleMenu && preact.h("button", { class: "button rleft", onClick: this.editTime }, "Time"),
                !this.simpleMenu && preact.h("button", { class: "button rright", onClick: this.editRound }, "Edit")),
            preact.h("div", { class: "section", style: { display: menuOpen === 'time' ? 'block' : 'none' } }, menuOpen === 'time' ? preact.h(TimeEditor, { setState: this.setStateFromChild, state: S }) : null),
            preact.h("div", { class: "section", style: { display: menuOpen === 'round' ? 'block' : 'none' } },
                preact.h(RoundEditor, { setState: this.setStateFromChild, state: S })),
            preact.h("button", { class: "textbox bigtextbox", onClick: this.editTime },
                preact.h(TimeLeft, __assign({}, this.timeLeft()))),
            preact.h("table", null,
                preact.h("tr", null,
                    preact.h("td", { width: "34%" },
                        preact.h("label", { class: "p1 name" }, S.name1)),
                    preact.h("td", null,
                        preact.h("label", null, "\u00A0")),
                    preact.h("td", { width: "34%" },
                        preact.h("label", { class: "p2 name" }, S.name2)))),
            preact.h("table", null,
                preact.h("tr", null,
                    preact.h("td", { width: "34%" },
                        preact.h("button", { class: "score p1", onClick: this.plusScore1, onContextMenu: this.minusScore1 },
                            "Score:",
                            preact.h("br", null),
                            preact.h("strong", null, S.score1)),
                        preact.h("label", { class: "p1 dots" }, "\u25CF ".repeat(S.match1) + "\u25CB ".repeat(Math.max(S.maxMatches - S.match1, 0)))),
                    preact.h("td", null,
                        preact.h("button", { class: "score", onClick: this.plusSimul, onContextMenu: this.minusSimul },
                            "Simul:",
                            preact.h("br", null),
                            preact.h("strong", null, S.simul))),
                    preact.h("td", { width: "34%" },
                        preact.h("button", { class: "score p2", onClick: this.plusScore2, onContextMenu: this.minusScore2 },
                            "Score:",
                            preact.h("br", null),
                            preact.h("strong", null, S.score2)),
                        preact.h("label", { class: "p2 dots" }, "\u25CF ".repeat(S.match2) + "\u25CB ".repeat(Math.max(S.maxMatches - S.match2, 0))))),
                !this.simpleMenu && preact.h("tr", null,
                    preact.h("td", { colSpan: 3 }, !S.startTime ?
                        preact.h("button", { class: "button verybigbutton", onClick: this.start }, "Start")
                        : S.pauseTime ?
                            preact.h("button", { class: "button verybigbutton", onClick: this.start }, "Resume")
                            :
                                preact.h("button", { class: "button verybigbutton", onClick: this.pause }, "Pause"))),
                !this.simpleMenu && preact.h("tr", null,
                    preact.h("td", null,
                        preact.h("button", { class: "button bigbutton", onClick: this.plusScore1 }, "+1"),
                        preact.h("br", null),
                        preact.h("button", { class: "button", onClick: this.minusScore1 }, "\u2212")),
                    preact.h("td", null,
                        preact.h("button", { class: "button bigbutton", onClick: this.plusSimul }, "+simul"),
                        preact.h("br", null),
                        preact.h("button", { class: "button", onClick: this.minusSimul }, "\u2212")),
                    preact.h("td", null,
                        preact.h("button", { class: "button bigbutton", onClick: this.plusScore2 }, "+1"),
                        preact.h("br", null),
                        preact.h("button", { class: "button", onClick: this.minusScore2 }, "\u2212")))));
    };
    return Main;
}(preact.Component));
preact.render(preact.h(Main, null), document.body);
if (navigator.serviceWorker && !navigator.serviceWorker.controller) {
    navigator.serviceWorker.register('service-worker.js', {
        scope: './'
    }).then(function (reg) {
        console.log('Service worker registered: ' + reg.scope);
    });
}
//# sourceMappingURL=saber.js.map