// ═══════════════════════════════════════════════════════════════
//  microbit-ai-webcam — micro:bit AI Camera Extension
//  Version 1.0.0
//  Host on GitHub as a public repo, then add in MakeCode via:
//  Extensions → search → github:YOUR_USERNAME/pxt-ai-webcam
// ═══════════════════════════════════════════════════════════════
//
//  FILE: main.ts  (put this file in the root of your GitHub repo)
// ═══════════════════════════════════════════════════════════════

/**
 * micro:bit AI Lab — Webcam Extension
 * Connects Teachable Machine AI model (running in the companion web app)
 * to MakeCode blocks via Serial communication.
 */

//% color="#7B2FBE" weight=90 icon="\uf030" block="AI Camera"
//% groups=['Setup','Detection','Advanced']
namespace AICamera {

    let _modelUrl = ""
    let _handlers: { [key: string]: () => void } = {}
    let _lastClass = ""
    let _confidence = 0
    let _threshold = 60
    let _isListening = false
    let _onAnyHandler: ((cls: string) => void) | null = null
    let _debugMode = false

    //% blockId="aicamera_load_model"
    //% block="load AI model from %url"
    //% url.defl="https://teachablemachine.withgoogle.com/models/YOUR_ID/"
    //% group="Setup" weight=100
    export function loadModel(url: string): void {
        _modelUrl = url
        serial.writeLine("LOAD:" + url)
        basic.showIcon(IconNames.Target)
        basic.pause(300)
        basic.clearScreen()
        startListening()
    }

    //% blockId="aicamera_set_threshold"
    //% block="set confidence threshold to %pct \\%"
    //% pct.min=1 pct.max=100 pct.defl=60
    //% group="Setup" weight=90
    export function setThreshold(pct: number): void {
        _threshold = Math.max(1, Math.min(100, pct))
        serial.writeLine("THRESH:" + _threshold)
    }

    //% blockId="aicamera_debug"
    //% block="set debug mode %on"
    //% on.shadow="toggleOnOff"
    //% group="Setup" weight=80
    export function setDebug(on: boolean): void {
        _debugMode = on
    }

    //% blockId="aicamera_on_class"
    //% block="when AI sees %className"
    //% className.defl="Class 1"
    //% group="Detection" weight=100
    export function onClass(className: string, handler: () => void): void {
        _handlers[className.toLowerCase().trim()] = handler
        if (!_isListening) startListening()
    }

    //% blockId="aicamera_on_any"
    //% block="when AI detects anything"
    //% group="Detection" weight=90
    export function onAnyClass(handler: () => void): void {
        _onAnyHandler = handler
        if (!_isListening) startListening()
    }

    //% blockId="aicamera_class_name"
    //% block="detected class"
    //% group="Detection" weight=80
    export function detectedClass(): string {
        return _lastClass
    }

    //% blockId="aicamera_confidence"
    //% block="detection confidence"
    //% group="Detection" weight=70
    export function detectedConfidence(): number {
        return _confidence
    }

    //% blockId="aicamera_is_class"
    //% block="AI currently sees %className"
    //% className.defl="Class 1"
    //% group="Detection" weight=60
    export function isClass(className: string): boolean {
        return _lastClass.toLowerCase().trim() === className.toLowerCase().trim()
    }

    //% blockId="aicamera_send_command"
    //% block="send command %cmd to AI app"
    //% cmd.defl="STATUS"
    //% group="Advanced" weight=50
    export function sendCommand(cmd: string): void {
        serial.writeLine(cmd)
    }

    //% blockId="aicamera_show_class"
    //% block="show detected class on screen"
    //% group="Advanced" weight=40
    export function showDetectedClass(): void {
        if (_lastClass) basic.showString(_lastClass)
    }

    function startListening(): void {
        if (_isListening) return
        _isListening = true
        serial.setTxBufferSize(64)
        serial.setRxBufferSize(64)
        serial.setBaudRate(BaudRate.BaudRate115200)
        serial.onDataReceived(serial.delimiters(Delimiters.NewLine), function () {
            const raw = serial.readLine().trim()
            if (!raw) return
            if (raw.substr(0, 6) === "CLASS:") {
                const parts = raw.split(":")
                if (parts.length >= 3) {
                    handleDetection(parts[1], parseInt(parts[2]))
                    return
                }
            }
            handleIconCommand(raw)
        })
    }

    function handleDetection(name: string, conf: number): void {
        if (conf < _threshold) { _lastClass = ""; _confidence = 0; return }
        _lastClass = name; _confidence = conf
        if (_debugMode) basic.showString(name.substr(0, 1).toUpperCase())
        const key = name.toLowerCase().trim()
        if (_handlers[key]) _handlers[key]()
        if (_onAnyHandler) _onAnyHandler(name)
    }

    function handleIconCommand(cmd: string): void {
        if (cmd === "HEART") basic.showIcon(IconNames.Heart)
        else if (cmd === "HAPPY") basic.showIcon(IconNames.Happy)
        else if (cmd === "SAD") basic.showIcon(IconNames.Sad)
        else if (cmd === "ANGRY") basic.showIcon(IconNames.Angry)
        else if (cmd === "SURP") basic.showIcon(IconNames.Surprised)
        else if (cmd === "YES") basic.showIcon(IconNames.Yes)
        else if (cmd === "NO") basic.showIcon(IconNames.No)
        else if (cmd === "ARROWN") basic.showArrow(ArrowNames.North)
        else if (cmd === "ARROWS") basic.showArrow(ArrowNames.South)
        else if (cmd === "ARROWE") basic.showArrow(ArrowNames.East)
        else if (cmd === "ARROWW") basic.showArrow(ArrowNames.West)
        else if (cmd === "DIAMOND") basic.showIcon(IconNames.Diamond)
        else if (cmd === "SKULL") basic.showIcon(IconNames.Skull)
        else if (cmd === "GHOST") basic.showIcon(IconNames.Ghost)
        else if (cmd === "MUSIC") basic.showIcon(IconNames.QuarterNote)
        else if (cmd === "FLASH") basic.showIcon(IconNames.Sword)
        else if (cmd === "CLEAR") basic.clearScreen()
        else if (cmd.substr(0, 4) === "NUM:") basic.showNumber(parseInt(cmd.substr(4)))
    }
}

// ═══════════════════════════════════════════════════════════════
//  FILE: pxt.json  (create this file alongside main.ts)
// ═══════════════════════════════════════════════════════════════
/*
{
    "name": "microbit-ai-webcam",
    "version": "1.0.0",
    "description": "Connect Teachable Machine AI webcam to micro:bit blocks.",
    "license": "MIT",
    "dependencies": { "device": "*" },
    "files": ["main.ts", "README.md"],
    "testFiles": ["test.ts"],
    "public": true,
    "supportedTargets": ["microbit"],
    "preferredEditor": "blocksprj"
}
*/
