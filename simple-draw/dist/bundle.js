(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const shape_1 = require("./shape");
class CreateShapeAction {
    constructor(layer, shape) {
        this.layer = layer;
        this.shape = shape;
    }
    do() {
        this.layer.add(this.shape);
        return this.shape;
    }
    undo() {
        this.layer.objects = this.layer.objects.filter(obj => obj !== this.shape);
    }
}
class CreateCircleAction extends CreateShapeAction {
    constructor(layer, x, y, radius) {
        super(layer, new shape_1.Circle(x, y, radius, 0));
        this.x = x;
        this.y = y;
        this.radius = radius;
    }
}
exports.CreateCircleAction = CreateCircleAction;
class CreateRectangleAction extends CreateShapeAction {
    constructor(layer, x, y, width, height) {
        super(layer, new shape_1.Rectangle(x, y, width, height, 0));
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
}
exports.CreateRectangleAction = CreateRectangleAction;
class TranslateAction {
    constructor(shape, xd, yd) {
        this.shape = shape;
        this.xd = xd;
        this.yd = yd;
    }
    do() {
        this.oldX = this.shape.x;
        this.oldY = this.shape.y;
        this.shape.translate(this.xd, this.yd);
    }
    undo() {
        this.shape.x = this.oldX;
        this.shape.y = this.oldY;
    }
}
exports.TranslateAction = TranslateAction;
class RotateAction {
    constructor(shape, degree) {
        this.shape = shape;
        this.degree = degree;
    }
    do() {
        this.oldDegree = this.shape.rotation;
        this.shape.rotate(this.degree);
    }
    undo() {
        this.shape.rotation = this.oldDegree;
    }
}
exports.RotateAction = RotateAction;

},{"./shape":11}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const layer_1 = require("./layer");
const actions_1 = require("./actions");
const undo_1 = require("./undo");
const view_1 = require("./view");
class SimpleDrawDocument extends view_1.Observable {
    constructor(numLayers) {
        super();
        this.undoManager = new undo_1.UndoManager();
        this.layers = new Array();
        for (let i = 0; i < numLayers; i++) {
            this.layers.push(new layer_1.Layer("Layer " + i, 10, 10));
        }
    }
    undo() {
        this.undoManager.undo();
    }
    redo() {
        this.undoManager.redo();
    }
    draw(render) {
        render.draw(...this.layers);
    }
    do(a) {
        this.undoManager.onActionDone(a);
        let ret = a.do();
        this.notify();
        return ret;
    }
    createRectangle(x, y, width, height, layer) {
        return this.do(new actions_1.CreateRectangleAction(this.layers[layer - 1], x, y, width, height));
    }
    createCircle(x, y, radius, layer) {
        return this.do(new actions_1.CreateCircleAction(this.layers[layer - 1], x, y, radius));
    }
    translate(s, xd, yd) {
        return this.do(new actions_1.TranslateAction(s, xd, yd));
    }
    rotate(s, degree) {
        return this.do(new actions_1.RotateAction(s, degree));
    }
}
exports.SimpleDrawDocument = SimpleDrawDocument;

},{"./actions":1,"./layer":6,"./undo":13,"./view":14}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const view_1 = require("./view");
const exportFactory_1 = require("./exportFactory");
const file_saver_1 = require("file-saver");
const render_1 = require("./render");
const repl_1 = require("./repl");
class EventListener {
    constructor(doc, view, fileExporter) {
        this.doc = doc;
        this.view = view;
        this.fileExporter = fileExporter;
        this.interpreter = new repl_1.Repl(doc, view);
        this.undoButton = document.getElementById('undo');
        this.undoButton.addEventListener("click", (e) => {
            this.doc.undo();
            this.view.setLayers();
            this.view.render();
        });
        this.redoButton = document.getElementById('redo');
        this.redoButton.addEventListener("click", (e) => {
            this.doc.redo();
            this.view.setLayers();
            this.view.render();
        });
        this.exportTextButton = document.getElementById('export-text');
        this.exportTextButton.addEventListener("click", (e) => {
            let stringToReturn = fileExporter.ExportFile(exportFactory_1.FileFormat.Txt, this.doc.layers);
            this.DownloadFile(stringToReturn, exportFactory_1.FileFormat.Txt);
        });
        this.exportXmlButton = document.getElementById('export-xml');
        this.exportXmlButton.addEventListener("click", (e) => {
            let stringToReturn = fileExporter.ExportFile(exportFactory_1.FileFormat.Xml, this.doc.layers);
            this.DownloadFile(stringToReturn, exportFactory_1.FileFormat.Xml);
        });
        this.changeStyleButton = document.getElementById('change-style');
        this.changeStyleButton.addEventListener("click", (e) => {
            this.view.changeState();
            if (this.view.styler.style === render_1.RenderStyle.Backgrounded) {
                this.changeStyleButton.style.backgroundColor = '#007bff';
            }
            else if (this.view.styler.style === render_1.RenderStyle.Normal) {
                this.changeStyleButton.style.backgroundColor = '';
            }
        });
        this.rectangleButton = document.getElementById('create-rectangle');
        this.rectangleButton.addEventListener("click", (e) => this.createRectangle());
        this.circleButton = document.getElementById('create-circle');
        this.circleButton.addEventListener("click", (e) => this.createCircle());
        this.canvasButton = document.getElementById('create-canvas');
        this.canvasButton.addEventListener("click", (e) => {
            this.view.addRender(new view_1.CanvasFactory());
        });
        this.svgButton = document.getElementById('create-svg');
        this.svgButton.addEventListener("click", (e) => {
            this.view.addRender(new view_1.SVGFactory());
        });
        this.commandInput = document.getElementById('commandForm');
        this.commandInput.addEventListener("submit", (e) => { e.preventDefault(); e.stopPropagation(); this.runCommand(); });
    }
    runCommand() {
        let input = document.getElementById('commandLine');
        let invalid = document.getElementsByClassName('invalid-feedback')[0];
        if (this.interpreter.intepretCommand(input.value))
            invalid.style.display = 'none';
        else
            invalid.style.display = 'block';
        input.value = "";
        this.view.setLayers();
        this.view.render();
    }
    createRectangle() {
        var xPosition = parseInt(document.getElementById('input-rect-x').value);
        var yPosition = parseInt(document.getElementById('input-rect-y').value);
        var heigth = parseInt(document.getElementById('input-rect-h').value);
        var width = parseInt(document.getElementById('input-rect-w').value);
        var layer = parseInt(document.getElementById('input-rect-layer').value);
        this.doc.createRectangle(xPosition, yPosition, Math.abs(width), Math.abs(heigth), layer);
        this.view.setLayers();
        this.view.render();
    }
    createCircle() {
        var xPosition = parseInt(document.getElementById('input-circle-x').value);
        var yPosition = parseInt(document.getElementById('input-circle-y').value);
        var radius = parseInt(document.getElementById('input-circle-r').value);
        var layer = parseInt(document.getElementById('input-circle-layer').value);
        this.doc.createCircle(xPosition, yPosition, Math.abs(radius), layer);
        this.view.setLayers();
        this.view.render();
    }
    DownloadFile(text, format) {
        var file;
        var fileName = "simpleDraw." + exportFactory_1.FileFormat[format].toLowerCase();
        if (format === exportFactory_1.FileFormat.Txt) {
            file = new File([text], fileName, { type: "text/plain;charset=utf-8" });
        }
        else if (format === exportFactory_1.FileFormat.Xml) {
            file = new File([text], fileName, { type: "text/xml;charset=utf-8" });
        }
        file_saver_1.saveAs(file);
    }
}
exports.EventListener = EventListener;

},{"./exportFactory":5,"./render":7,"./repl":8,"./view":14,"file-saver":15}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const shape_1 = require("./shape");
class ConsolePrinter {
    CreateFileHeader() {
    }
    CreateFileContent(layers) {
        for (const layer of layers) {
            console.log(layer.name);
            if (layer.visible) {
                for (const shape of layer.objects) {
                    if (shape instanceof shape_1.Rectangle) {
                        console.log('Rectangle', shape.x, shape.y, shape.width, shape.height);
                    }
                    if (shape instanceof shape_1.Circle) {
                        console.log('Circle', shape.x, shape.y, shape.radius);
                    }
                }
            }
        }
    }
    CreateFileFooter() {
    }
    DownloadFile() {
        return '';
    }
}
exports.ConsolePrinter = ConsolePrinter;
class TextFileExporter {
    CreateFileHeader() {
        this.textToReturn = "";
    }
    CreateFileContent(layers) {
        for (const layer of layers) {
            this.textToReturn += layer.name + "\n";
            if (layer.visible) {
                for (const shape of layer.objects) {
                    if (shape instanceof shape_1.Rectangle) {
                        this.textToReturn += 'Rectangle ' + shape.x + ' ' + shape.y + ' ' + shape.width + ' ' + shape.height + '\n';
                    }
                    if (shape instanceof shape_1.Circle) {
                        this.textToReturn += 'Circle ' + ' ' + shape.x + ' ' + shape.y + ' ' + shape.radius + "\n";
                    }
                }
            }
        }
    }
    CreateFileFooter() {
    }
    DownloadFile() {
        return this.textToReturn;
    }
}
exports.TextFileExporter = TextFileExporter;
class XmlFileExporter {
    CreateFileHeader() {
        this.textToReturn = "";
        this.textToReturn += `<?xml version="1.0" encoding="UTF-8"?>`;
    }
    CreateFileContent(layers) {
        for (const layer of layers) {
            if (layer.visible) {
                this.textToReturn += "<Layer name='" + layer.name + "'>\n";
                for (const shape of layer.objects) {
                    if (shape instanceof shape_1.Rectangle) {
                        this.textToReturn += "<Rectangle>";
                        this.textToReturn += "<x>" + shape.x + "</x>";
                        this.textToReturn += "<y>" + shape.y + "</y>";
                        this.textToReturn += "<width>" + shape.width + "</width>";
                        this.textToReturn += "<height>" + shape.height + "</height>";
                        this.textToReturn += "</Rectangle>";
                    }
                    if (shape instanceof shape_1.Circle) {
                        this.textToReturn += "<Circle>";
                        this.textToReturn += "<x>" + shape.x + "</x>";
                        this.textToReturn += "<y>" + shape.y + "</y>";
                        this.textToReturn += "<radius>" + shape.radius + "</radius>";
                        this.textToReturn += "</Circle>";
                    }
                }
                this.textToReturn += "</Layer>";
            }
        }
    }
    CreateFileFooter() {
    }
    DownloadFile() {
        return this.textToReturn;
    }
}
exports.XmlFileExporter = XmlFileExporter;

},{"./shape":11}],5:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const export_1 = require("./export");
var FileFormat;
(function (FileFormat) {
    FileFormat[FileFormat["Console"] = 0] = "Console";
    FileFormat[FileFormat["Txt"] = 1] = "Txt";
    FileFormat[FileFormat["Xml"] = 2] = "Xml";
})(FileFormat = exports.FileFormat || (exports.FileFormat = {}));
class ExportFactory {
    constructor() {
        this.outputTypes = new Map();
        this.outputTypes.set(FileFormat.Console, new export_1.ConsolePrinter());
        this.outputTypes.set(FileFormat.Txt, new export_1.TextFileExporter());
        this.outputTypes.set(FileFormat.Xml, new export_1.XmlFileExporter());
    }
    ExportFile(format, layers) {
        let exporter = this.outputTypes.get(format);
        exporter.CreateFileHeader();
        exporter.CreateFileContent(layers);
        exporter.CreateFileFooter();
        return exporter.DownloadFile();
    }
}
exports.ExportFactory = ExportFactory;

},{"./export":4}],6:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const shape_1 = require("./shape");
class Layer extends shape_1.Shape {
    constructor(name, x, y) {
        super(x, y, 0);
        this.name = name;
        this.x = x;
        this.y = y;
        this.objects = new Array();
    }
    add(shape) {
        this.objects.push(shape);
    }
}
exports.Layer = Layer;

},{"./shape":11}],7:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const shape_1 = require("./shape");
const selection_1 = require("./selection");
var RenderStyle;
(function (RenderStyle) {
    RenderStyle[RenderStyle["Normal"] = 0] = "Normal";
    RenderStyle[RenderStyle["Backgrounded"] = 1] = "Backgrounded";
})(RenderStyle = exports.RenderStyle || (exports.RenderStyle = {}));
class RenderStyler {
    static changeStyle() {
        if (RenderStyler.style === RenderStyle.Normal) {
            RenderStyler.style = RenderStyle.Backgrounded;
        }
        else if (RenderStyler.style === RenderStyle.Backgrounded) {
            RenderStyler.style = RenderStyle.Normal;
        }
    }
}
exports.RenderStyler = RenderStyler;
class SVGRender extends RenderStyler {
    constructor() {
        super();
        this.zoom = 1;
        this.positionX = 0;
        this.positionY = 0;
        var container = document.getElementById('renders');
        const col = document.createElement('div');
        col.className = "col render d-flex flex-column-reverse align-items-center";
        container.appendChild(col);
        this.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        if (RenderStyler.style === RenderStyle.Normal) {
            this.svg.setAttribute('style', 'border: 1px solid blue');
        }
        else if (RenderStyler.style === RenderStyle.Backgrounded) {
            this.svg.setAttribute('style', 'border: 3px solid blue; background-color: #9BC1FF; ');
        }
        this.svg.setAttribute('width', '550');
        this.svg.setAttribute('height', '500');
        this.svg.addEventListener('mousedown', (e) => {
            const svgElem = e.currentTarget;
            var pt = svgElem.createSVGPoint();
            pt.x = e.clientX;
            pt.y = e.clientY;
            var svgP = pt.matrixTransform(svgElem.getScreenCTM().inverse());
            this.selectionStartX = svgP.x / this.zoom - this.positionX;
            this.selectionStartY = svgP.y / this.zoom - this.positionY;
        });
        this.svg.addEventListener('mouseup', (e) => {
            const svgElem = e.currentTarget;
            var pt = svgElem.createSVGPoint();
            pt.x = e.clientX;
            pt.y = e.clientY;
            var svgP = pt.matrixTransform(svgElem.getScreenCTM().inverse());
            this.selectionEndX = svgP.x / this.zoom - this.positionX;
            this.selectionEndY = svgP.y / this.zoom - this.positionY;
            selection_1.Selection.getInstance().newSelection(this.selectionStartX, this.selectionStartY, this.selectionEndX, this.selectionEndY);
        });
        col.appendChild(this.svg);
    }
    increaseZoom(factor) {
        this.zoom *= factor;
    }
    decreaseZoom(factor) {
        this.zoom /= factor;
    }
    setX(x) {
        this.positionX += x;
    }
    setY(y) {
        this.positionY += y;
    }
    setFillUpSvg(shape, firstColor, secondColor) {
        if (shape instanceof shape_1.Rectangle) {
            return "fill: " + firstColor + ";";
        }
        if (shape instanceof shape_1.Circle) {
            return "fill: " + secondColor + ";";
        }
    }
    setStyleSvg(shape) {
        let stringToReturn = "";
        stringToReturn += shape.selected ? 'stroke: blue;' : 'stroke:black; ';
        if (this.shapeStyle === shape_1.ShapeStyle.Color) {
            stringToReturn += shape.selected ? "fill-opacity: 0.75;" : "";
            stringToReturn += this.setFillUpSvg(shape, "green; ", "red;");
        }
        else if (this.shapeStyle === shape_1.ShapeStyle.Wireframe) {
            stringToReturn += this.setFillUpSvg(shape, "white; fill-opacity: 0;", "white; fill-opacity: 0;");
        }
        else {
            stringToReturn += shape.selected ? "fill-opacity: 0.75;" : "";
            stringToReturn += this.setFillUpSvg(shape, "grey;", "grey;");
        }
        return stringToReturn;
    }
    draw(...layers) {
        this.svg.innerHTML = "";
        for (const layer of layers) {
            if (layer.visible)
                for (const shape of layer.objects) {
                    if (shape instanceof shape_1.Rectangle && shape.visible) {
                        const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
                        const e = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                        e.setAttribute('style', this.setStyleSvg(shape));
                        const x = (shape.x + this.positionX) * this.zoom;
                        e.setAttribute('x', x.toString());
                        const y = (shape.y + this.positionY) * this.zoom;
                        e.setAttribute('y', y.toString());
                        const w = shape.width * this.zoom;
                        e.setAttribute('width', w.toString());
                        const h = shape.height * this.zoom;
                        e.setAttribute('height', h.toString());
                        g.setAttribute('transform', 'rotate(' + shape.rotation + "," + (x + w / 2.0) + "," + (y + h / 2.0) + ")");
                        g.appendChild(e);
                        this.svg.appendChild(g);
                    }
                    else if (shape instanceof shape_1.Circle && shape.visible) {
                        const e = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                        e.setAttribute('style', this.setStyleSvg(shape));
                        const x = (shape.x + this.positionX) * this.zoom;
                        e.setAttribute('cx', x.toString());
                        const y = (shape.y + this.positionY) * this.zoom;
                        e.setAttribute('cy', y.toString());
                        const r = shape.radius * this.zoom;
                        e.setAttribute('r', r.toString());
                        this.svg.appendChild(e);
                    }
                }
        }
    }
}
exports.SVGRender = SVGRender;
class CanvasRender extends RenderStyler {
    constructor() {
        super();
        this.zoom = 1;
        this.positionX = 0;
        this.positionY = 0;
        var container = document.getElementById('renders');
        const col = document.createElement('div');
        col.className = "col render d-flex flex-column-reverse align-items-center";
        container.appendChild(col);
        const canvas = document.createElement('canvas');
        if (RenderStyler.style === RenderStyle.Normal) {
            canvas.setAttribute('style', 'border: 1px solid red');
        }
        else if (RenderStyle.Backgrounded === RenderStyle.Backgrounded) {
            canvas.setAttribute('style', 'border: 3px solid red; background-color: #9BC1FF;');
        }
        canvas.setAttribute('width', '550');
        canvas.setAttribute('height', '500');
        canvas.addEventListener('mousedown', (e) => {
            const canvasElem = e.currentTarget;
            const rect = canvasElem.getBoundingClientRect();
            this.selectionStartX = (e.clientX - rect.left) / this.zoom - this.positionX;
            this.selectionStartY = (e.clientY - rect.top) / this.zoom - this.positionY;
        });
        canvas.addEventListener('mouseup', (e) => {
            const canvasElem = e.currentTarget;
            const rect = canvasElem.getBoundingClientRect();
            this.selectionEndX = (e.clientX - rect.left) / this.zoom - this.positionX;
            this.selectionEndY = (e.clientY - rect.top) / this.zoom - this.positionY;
            selection_1.Selection.getInstance().newSelection(this.selectionStartX, this.selectionStartY, this.selectionEndX, this.selectionEndY);
        });
        col.appendChild(canvas);
        this.ctx = canvas.getContext('2d');
    }
    increaseZoom(factor) {
        this.zoom *= factor;
    }
    decreaseZoom(factor) {
        this.zoom /= factor;
    }
    setX(x) {
        this.positionX += x;
    }
    setY(y) {
        this.positionY += y;
    }
    setFillUpCnvs(shape, firstColor, secondColor) {
        if (shape instanceof shape_1.Rectangle) {
            this.ctx.fillStyle = firstColor;
        }
        if (shape instanceof shape_1.Circle) {
            this.ctx.fillStyle = secondColor;
        }
    }
    setStyleCnvs(shape) {
        if (this.shapeStyle === shape_1.ShapeStyle.Color) {
            let color1 = shape.selected ? "rgba(0, 128, 0, 0.75)" : "rgba(0, 128, 0, 1)";
            let color2 = shape.selected ? "rgb(255, 0, 0, 0.75)" : "rgb(255, 0, 0, 1)";
            this.setFillUpCnvs(shape, color1, color2); //green / red
        }
        else if (this.shapeStyle === shape_1.ShapeStyle.Wireframe) {
            let color = shape.selected ? "rgba(255, 255, 255, 0)" : "rgba(255, 255, 255, 0)";
            this.setFillUpCnvs(shape, color, color);
        }
        else {
            let color = shape.selected ? "rgba(128,128,128, 0.75)" : "rgba(128,128,128, 1)";
            this.setFillUpCnvs(shape, color, color);
        }
    }
    draw(...layers) {
        this.ctx.clearRect(0, 0, 550, 550);
        this.ctx.save();
        this.ctx.scale(this.zoom, this.zoom);
        for (const layer of layers) {
            if (layer.visible)
                for (const shape of layer.objects) {
                    if (shape instanceof shape_1.Circle && shape.visible) {
                        this.ctx.beginPath();
                        this.ctx.arc(shape.x + this.positionX, shape.y + this.positionY, shape.radius, 0, 2 * Math.PI);
                        this.setStyleCnvs(shape);
                        this.ctx.fill();
                        this.ctx.strokeStyle = shape.selected ? "blue" : "black";
                        this.ctx.stroke();
                        this.ctx.closePath();
                    }
                    else if (shape instanceof shape_1.Rectangle && shape.visible) {
                        this.setStyleCnvs(shape);
                        this.ctx.translate(shape.x + this.positionX + shape.width / 2.0, shape.y + this.positionY + shape.height / 2.0);
                        this.ctx.rotate(shape.rotation * Math.PI / 180);
                        this.ctx.translate(-(shape.x + this.positionX + shape.width / 2.0), -(shape.y + this.positionY + shape.height / 2.0));
                        this.ctx.fillRect(shape.x + this.positionX, shape.y + this.positionY, shape.width, shape.height);
                        this.ctx.strokeStyle = shape.selected ? "blue" : "black";
                        this.ctx.strokeRect(shape.x + this.positionX, shape.y + this.positionY, shape.width, shape.height);
                        this.ctx.translate(shape.x + this.positionX + shape.width / 2.0, shape.y + this.positionY + shape.height / 2.0);
                        this.ctx.rotate(-shape.rotation * Math.PI / 180);
                        this.ctx.translate(-(shape.x + this.positionX + shape.width / 2.0), -(shape.y + this.positionY + shape.height / 2.0));
                    }
                }
        }
        this.ctx.restore();
    }
}
exports.CanvasRender = CanvasRender;

},{"./selection":10,"./shape":11}],8:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tools_1 = require("./tools");
const view_1 = require("./view");
class Context {
    constructor(cmd, doc, view) {
        this.doc = doc;
        this.view = view;
        this.i = 0;
        this.input = cmd.split(' ');
    }
    hasNext() {
        return this.i < this.input.length;
    }
    getToken() {
        return this.input[this.i];
    }
    next() {
        this.i++;
        return true;
    }
    getDoc() {
        return this.doc;
    }
    getView() {
        return this.view;
    }
}
class TerminalExpression {
    constructor(regExp) {
        this.regExp = regExp;
    }
    interpret(context) {
        return context.hasNext() && this.regExp.test(this.capture = context.getToken()) && context.next();
    }
}
class TerminalExpressionNumber extends TerminalExpression {
    constructor(float) {
        if (float)
            super(new RegExp('^-?[0-9]+(\.[0-9]+)?$'));
        else
            super(new RegExp('^[0-9]+$'));
    }
    getValue() {
        return Number(this.capture);
    }
}
class RectangleExp {
    interpret(context) {
        let args = [new TerminalExpression(new RegExp('^rectangle$')), new TerminalExpressionNumber(true),
            new TerminalExpressionNumber(true), new TerminalExpressionNumber(true), new TerminalExpressionNumber(true), new TerminalExpressionNumber(false)];
        for (const exp of args)
            if (!exp.interpret(context))
                return false;
        let params = new Array();
        for (let i = 1; i < args.length; i++)
            params.push(args[i].getValue());
        try {
            return context.getDoc().createRectangle(params[0], params[1], params[2], params[3], params[4]) !== null;
        }
        catch (e) {
            return false;
        }
    }
}
class CircleExp {
    interpret(context) {
        let args = [new TerminalExpression(new RegExp('^circle$')), new TerminalExpressionNumber(true),
            new TerminalExpressionNumber(true), new TerminalExpressionNumber(true), new TerminalExpressionNumber(false)];
        for (const exp of args)
            if (!exp.interpret(context))
                return false;
        let params = new Array();
        for (let i = 1; i < args.length; i++)
            params.push(args[i].getValue());
        try {
            return (context.getDoc().createCircle(params[0], params[1], params[2], params[3]) !== null);
        }
        catch (e) {
            return false;
        }
    }
}
class CreateExp {
    interpret(context) {
        let and = [new TerminalExpression(new RegExp("^create$"))];
        let or = [new RectangleExp(), new CircleExp()];
        for (const exp of and)
            if (!exp.interpret(context))
                return false;
        for (const exp of or)
            if (exp.interpret(context))
                return true;
        return false;
    }
}
class RotateExp {
    interpret(context) {
        let and = [new TerminalExpression(new RegExp("^rotate$")),
            new TerminalExpression(new RegExp("^selection$")), new TerminalExpressionNumber(true)];
        for (const exp of and)
            if (!exp.interpret(context))
                return false;
        try {
            return tools_1.Rotate.rotateSelection(context.getDoc(), and[2].getValue());
        }
        catch (e) {
            return false;
        }
    }
}
class ZoomExp {
    interpret(context) {
        let and = [new TerminalExpression(new RegExp("^zoom$")),
            new TerminalExpressionNumber(false), new TerminalExpressionNumber(true)];
        for (const exp of and)
            if (!exp.interpret(context))
                return false;
        let params = new Array();
        for (let i = 1; i < and.length; i++)
            params.push(and[i].getValue());
        try {
            context.getView().renders[params[0] - 1].increaseZoom(params[1]);
            return true;
        }
        catch (e) {
            return false;
        }
    }
}
class TranslateSelectionExp {
    interpret(context) {
        let and = [new TerminalExpression(new RegExp("^selection$")),
            new TerminalExpressionNumber(true), new TerminalExpressionNumber(true)];
        for (const exp of and)
            if (!exp.interpret(context))
                return false;
        let params = new Array();
        for (let i = 1; i < and.length; i++)
            params.push(and[i].getValue());
        try {
            return tools_1.Translate.setPositionSelection(context.getDoc(), params[0], params[1]);
        }
        catch (e) {
            return false;
        }
    }
}
class TranslateViewportExp {
    interpret(context) {
        let and = [new TerminalExpressionNumber(false),
            new TerminalExpressionNumber(true), new TerminalExpressionNumber(true)];
        for (const exp of and)
            if (!exp.interpret(context))
                return false;
        let params = new Array();
        for (let i = 0; i < and.length; i++)
            params.push(and[i].getValue());
        try {
            context.getView().renders[params[0] - 1].setX(params[1]);
            context.getView().renders[params[0] - 1].setX(params[2]);
            return true;
        }
        catch (e) {
            return false;
        }
    }
}
class TranslateExp {
    interpret(context) {
        let and = [new TerminalExpression(new RegExp("^translate$"))];
        let or = [new TranslateSelectionExp(), new TranslateViewportExp()];
        for (const exp of and)
            if (!exp.interpret(context))
                return false;
        for (const exp of or)
            if (exp.interpret(context))
                return true;
        return false;
    }
}
class UndoExp {
    interpret(context) {
        let and = [new TerminalExpression(new RegExp("^undo$"))];
        for (const exp of and)
            if (!exp.interpret(context))
                return false;
        try {
            context.getDoc().undo();
            return true;
        }
        catch (e) {
            return false;
        }
    }
}
class RedoExp {
    interpret(context) {
        let and = [new TerminalExpression(new RegExp("^redo$"))];
        for (const exp of and)
            if (!exp.interpret(context))
                return false;
        try {
            context.getDoc().redo();
            return true;
        }
        catch (e) {
            return false;
        }
    }
}
class CreateCanvasExp {
    interpret(context) {
        let and = [new TerminalExpression(new RegExp("^canvas$"))];
        for (const exp of and)
            if (!exp.interpret(context))
                return false;
        try {
            context.getView().addRender(new view_1.CanvasFactory());
            return true;
        }
        catch (e) {
            return false;
        }
    }
}
class CreateSVGExp {
    interpret(context) {
        let and = [new TerminalExpression(new RegExp("^svg$"))];
        for (const exp of and)
            if (!exp.interpret(context))
                return false;
        try {
            context.getView().addRender(new view_1.SVGFactory());
            return true;
        }
        catch (e) {
            return false;
        }
    }
}
class CreateViewportExp {
    interpret(context) {
        let and = [new TerminalExpression(new RegExp("^viewport$"))];
        let or = [new CreateCanvasExp(), new CreateSVGExp()];
        for (const exp of and)
            if (!exp.interpret(context))
                return false;
        for (const exp of or)
            if (exp.interpret(context))
                return true;
        return false;
    }
}
class Command {
    interpret(context) {
        let or = [new CreateExp(), new RotateExp(), new TranslateExp(),
            new UndoExp(), new RedoExp(), new ZoomExp(), new CreateViewportExp()];
        for (const exp of or) {
            if (exp.interpret(context))
                return true;
        }
        return false;
    }
}
class Repl {
    constructor(doc, view) {
        this.doc = doc;
        this.view = view;
    }
    intepretCommand(cmd) {
        let ctx = new Context(cmd, this.doc, this.view);
        return new Command().interpret(ctx);
    }
}
exports.Repl = Repl;

},{"./tools":12,"./view":14}],9:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const document_1 = require("./document");
const view_1 = require("./view");
const events_1 = require("./events");
const exportFactory_1 = require("./exportFactory");
const doc = new document_1.SimpleDrawDocument(4);
const c1 = doc.createCircle(100, 50, 30, 2);
const r1 = doc.createRectangle(10, 10, 80, 80, 2);
const r2 = doc.createRectangle(30, 60, 80, 40, 3);
const view = new view_1.ViewController(doc, new view_1.SVGFactory());
const fileExporter = new exportFactory_1.ExportFactory();
const eventListener = new events_1.EventListener(doc, view, fileExporter);
view.render();

},{"./document":2,"./events":3,"./exportFactory":5,"./view":14}],10:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const shape_1 = require("./shape");
class Selection {
    constructor() {
        this.selectedObjects = Array();
    }
    static getInstance() {
        if (!Selection.instance)
            Selection.instance = new Selection();
        return Selection.instance;
    }
    newSelection(x1, y1, x2, y2) {
        this.clearSelection();
        this.x = x1 > x2 ? x2 : x1;
        this.y = y1 > y2 ? y2 : y1;
        this.width = Math.abs(x1 - x2);
        this.height = Math.abs(y1 - y2);
        if (!this.view)
            return;
        for (const layer of this.layers) {
            if (layer.visible) {
                for (const shape of layer.objects) {
                    if (this.isInside(shape)) {
                        this.selectedObjects.push(shape);
                        shape.selected = true;
                    }
                }
            }
        }
        this.view.render();
    }
    clearSelection() {
        for (const shape of this.selectedObjects)
            shape.selected = false;
        this.selectedObjects = new Array();
    }
    isInside(shape) {
        if (shape instanceof shape_1.Rectangle && shape.visible) {
            return !(this.x + this.width < shape.x ||
                this.x > shape.x + shape.width ||
                this.y + this.height < shape.y ||
                this.y > shape.y + shape.height);
        }
        else if (shape instanceof shape_1.Circle && shape.visible) {
            const distX = Math.abs(shape.x - this.x);
            const distY = Math.abs(shape.y - this.y);
            if (distX > (this.width / 2 + shape.radius) ||
                distY > (this.height / 2 + shape.radius))
                return false;
            if (distX <= this.width / 2 ||
                distY <= this.height / 2)
                return true;
            return Math.pow(distX - this.width / 2, 2) + Math.pow(distY - this.height / 2, 2)
                <= Math.pow(shape.radius, 2);
        }
        return false;
    }
    setView(view) {
        this.view = view;
        this.layers = this.view.doc.layers;
    }
}
exports.Selection = Selection;

},{"./shape":11}],11:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ShapeStyle;
(function (ShapeStyle) {
    ShapeStyle[ShapeStyle["Default"] = 0] = "Default";
    ShapeStyle[ShapeStyle["Wireframe"] = 1] = "Wireframe";
    ShapeStyle[ShapeStyle["Color"] = 2] = "Color";
})(ShapeStyle = exports.ShapeStyle || (exports.ShapeStyle = {}));
class Shape {
    constructor(x, y, rotation) {
        this.x = x;
        this.y = y;
        this.rotation = rotation;
        this.visible = true;
        this.selected = false;
    }
    translate(xd, yd) {
        this.x += xd;
        this.y += yd;
    }
    rotate(degree) {
        this.rotation += degree;
    }
}
exports.Shape = Shape;
class Rectangle extends Shape {
    constructor(x, y, width, height, rotation) {
        super(x, y, rotation);
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.rotation = rotation;
    }
}
exports.Rectangle = Rectangle;
class Circle extends Shape {
    constructor(x, y, radius, rotation) {
        super(x, y, rotation);
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.rotation = rotation;
    }
}
exports.Circle = Circle;

},{}],12:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const selection_1 = require("./selection");
const shape_1 = require("./shape");
class Tool {
    constructor(render, doc) {
        this.render = render;
        this.doc = doc;
    }
}
exports.Tool = Tool;
class Zoom extends Tool {
    increaseZoom() {
        this.render.increaseZoom(2);
    }
    decreaseZoom() {
        this.render.decreaseZoom(2);
    }
    createTool() {
        const zoomContainer = document.createElement('div');
        const buttonGroup = document.createElement('div');
        buttonGroup.className = "btn-group";
        const buttonZoomIn = document.createElement('button');
        buttonZoomIn.className = "btn btn-dark";
        const iconZoomIn = document.createElement('i');
        iconZoomIn.className = "fas fa-search-plus";
        buttonZoomIn.appendChild(iconZoomIn);
        buttonZoomIn.addEventListener("click", (e) => { this.increaseZoom(); this.doc.draw(this.render); });
        const buttonZoomOut = document.createElement('button');
        buttonZoomOut.className = "btn btn-dark";
        const iconZoomOut = document.createElement('i');
        iconZoomOut.className = "fa fa-search-minus";
        buttonZoomOut.appendChild(iconZoomOut);
        buttonZoomOut.addEventListener("click", (e) => { this.decreaseZoom(); this.doc.draw(this.render); });
        buttonGroup.appendChild(buttonZoomIn);
        buttonGroup.appendChild(buttonZoomOut);
        zoomContainer.appendChild(buttonGroup);
        return zoomContainer;
    }
}
exports.Zoom = Zoom;
class Translate extends Tool {
    static setPositionSelection(doc, x, y) {
        let selected = false;
        for (let shape of selection_1.Selection.getInstance().selectedObjects) {
            doc.translate(shape, x, y);
            selected = true;
        }
        return selected;
    }
    setPosition(x, y) {
        if (!Translate.setPositionSelection(this.doc, x, y)) {
            this.render.setX(x);
            this.render.setY(y);
        }
    }
    createTool() {
        const translateContainer = document.createElement('div');
        const buttonGroup = document.createElement('div');
        buttonGroup.className = "btn-group";
        const buttonUp = document.createElement('button');
        buttonUp.className = "btn btn-dark";
        buttonUp.innerHTML = "up";
        buttonUp.addEventListener("click", (e) => { this.setPosition(0, -10); this.doc.draw(this.render); });
        const buttonLeft = document.createElement('button');
        buttonLeft.className = "btn btn-dark";
        buttonLeft.innerHTML = "left";
        buttonLeft.addEventListener("click", (e) => { this.setPosition(-10, 0); this.doc.draw(this.render); });
        const buttonDown = document.createElement('button');
        buttonDown.className = "btn btn-dark";
        buttonDown.innerHTML = "down";
        buttonDown.addEventListener("click", (e) => { this.setPosition(0, 10); this.doc.draw(this.render); });
        const buttonRight = document.createElement('button');
        buttonRight.className = "btn btn-dark";
        buttonRight.innerHTML = "right";
        buttonRight.addEventListener("click", (e) => { this.setPosition(10, 0); this.doc.draw(this.render); });
        buttonGroup.appendChild(buttonLeft);
        buttonGroup.appendChild(buttonUp);
        buttonGroup.appendChild(buttonDown);
        buttonGroup.appendChild(buttonRight);
        translateContainer.appendChild(buttonGroup);
        return translateContainer;
    }
}
exports.Translate = Translate;
class Style extends Tool {
    setStyle(style) {
        this.render.shapeStyle = style;
    }
    createTool() {
        var options = ["Default", "Wireframe", "Color"];
        const select = document.createElement('select');
        select.className = "viewport-style";
        for (var i = 0; i < options.length; i++) {
            var option = document.createElement("option");
            option.value = options[i];
            option.text = options[i];
            select.appendChild(option);
        }
        select.addEventListener("change", (e) => {
            if (select.value === "Color") {
                this.setStyle(shape_1.ShapeStyle.Color);
            }
            else if (select.value === "Wireframe") {
                this.setStyle(shape_1.ShapeStyle.Wireframe);
            }
            else {
                this.setStyle(shape_1.ShapeStyle.Default);
            }
            this.doc.draw(this.render);
        });
        return select;
    }
}
exports.Style = Style;
class Rotate extends Tool {
    static rotateSelection(doc, deg) {
        let selected = false;
        for (let shape of selection_1.Selection.getInstance().selectedObjects) {
            doc.rotate(shape, deg);
            selected = true;
        }
        return selected;
    }
    createTool() {
        const rotateContainer = document.createElement('div');
        const buttonGroup = document.createElement('div');
        buttonGroup.className = "btn-group";
        const button45 = document.createElement('button');
        button45.className = "btn btn-secondary";
        button45.innerHTML = "45°";
        button45.addEventListener("click", (e) => { Rotate.rotateSelection(this.doc, 45); });
        const button90 = document.createElement('button');
        button90.className = "btn btn-secondary";
        button90.innerHTML = "90°";
        button90.addEventListener("click", (e) => { Rotate.rotateSelection(this.doc, 90); });
        const button_minus45 = document.createElement('button');
        button_minus45.className = "btn btn-secondary";
        button_minus45.innerHTML = "-45°";
        button_minus45.addEventListener("click", (e) => { Rotate.rotateSelection(this.doc, -45); });
        const button_minus90 = document.createElement('button');
        button_minus90.className = "btn btn-secondary";
        button_minus90.innerHTML = "-90°";
        button_minus90.addEventListener("click", (e) => { Rotate.rotateSelection(this.doc, -90); });
        buttonGroup.appendChild(button45);
        buttonGroup.appendChild(button90);
        buttonGroup.appendChild(button_minus45);
        buttonGroup.appendChild(button_minus90);
        rotateContainer.appendChild(buttonGroup);
        return rotateContainer;
    }
}
exports.Rotate = Rotate;

},{"./selection":10,"./shape":11}],13:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class UndoManager {
    constructor() {
        this.doStack = new Array();
        this.undoStack = new Array();
    }
    undo() {
        if (this.doStack.length > 0) {
            const a1 = this.doStack.pop();
            a1.undo();
            this.undoStack.push(a1);
        }
    }
    redo() {
        if (this.undoStack.length > 0) {
            const a1 = this.undoStack.pop();
            a1.do();
            this.doStack.push(a1);
        }
    }
    onActionDone(a) {
        this.doStack.push(a);
        this.undoStack.length = 0;
    }
}
exports.UndoManager = UndoManager;

},{}],14:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const render_1 = require("./render");
const selection_1 = require("./selection");
const tools_1 = require("./tools");
class Observable {
    constructor() {
        this.observers = new Array();
    }
    register(obs) { this.observers.push(obs); }
    notify() {
        for (let obs of this.observers)
            obs.update();
    }
}
exports.Observable = Observable;
class SVGFactory {
    createRender() {
        return new render_1.SVGRender();
    }
}
exports.SVGFactory = SVGFactory;
class CanvasFactory {
    createRender() {
        return new render_1.CanvasRender();
    }
}
exports.CanvasFactory = CanvasFactory;
class ViewController {
    constructor(doc, factory) {
        this.doc = doc;
        this.renders = new Array();
        this.styler = render_1.RenderStyler;
        this.styler.style = render_1.RenderStyle.Normal;
        this.renders.push(factory.createRender());
        this.setLayers();
        this.createGlobalTools();
        this.createViewportTools();
        this.doc.register(this);
        selection_1.Selection.getInstance().setView(this);
    }
    changeState() {
        this.styler.changeStyle();
    }
    addRender(factory) {
        this.renders.push(factory.createRender());
        this.createViewportTools();
        this.render();
    }
    update() {
        this.render();
    }
    render() {
        for (const render of this.renders) {
            this.doc.draw(render);
        }
    }
    createGlobalTools() {
        const toolsContainer = document.getElementById("global-tools");
        toolsContainer.appendChild(new tools_1.Rotate(this.renders[0], this.doc).createTool());
    }
    createViewportTools() {
        const lastRender = document.querySelectorAll("[id=renders] > .render");
        const lastRenderId = lastRender.length - 1;
        const buttonContainer = document.createElement('div');
        buttonContainer.className = "viewport-tools";
        buttonContainer.appendChild(new tools_1.Zoom(this.renders[lastRenderId], this.doc).createTool());
        buttonContainer.appendChild(new tools_1.Style(this.renders[lastRenderId], this.doc).createTool());
        buttonContainer.appendChild(new tools_1.Translate(this.renders[lastRenderId], this.doc).createTool());
        lastRender[lastRenderId].appendChild(buttonContainer);
    }
    setLayers() {
        const layerContainer = document.getElementById('layer-container');
        layerContainer.innerHTML = "";
        for (let i = 0; i < this.doc.layers.length; i++) {
            layerContainer.appendChild(this.createLayer(this.doc.layers[i], i + 1));
        }
    }
    createLayer(layer, id) {
        const div = document.createElement('div');
        div.appendChild(this.createCheckbox(layer, id));
        layer.objects.forEach(object => div.appendChild(this.createCheckbox(object)));
        return div;
    }
    createCheckbox(shape, id) {
        const checkbox = document.createElement('div');
        const input = document.createElement('input');
        input.className = "form-check-input";
        input.type = "checkbox";
        input.checked = true;
        input.addEventListener("change", (e) => {
            if (input.checked)
                shape.visible = true;
            else
                shape.visible = false;
            this.render();
        });
        const label = document.createElement('label');
        label.className = "form-check-label";
        if (shape.constructor.name === "Layer") {
            checkbox.className = "form-check heading";
            label.innerText = "Layer " + id;
        }
        else {
            checkbox.className = "form-check";
            label.innerText = shape.constructor.name;
        }
        checkbox.appendChild(input);
        checkbox.appendChild(label);
        return checkbox;
    }
}
exports.ViewController = ViewController;

},{"./render":7,"./selection":10,"./tools":12}],15:[function(require,module,exports){
(function (global){
(function(a,b){if("function"==typeof define&&define.amd)define([],b);else if("undefined"!=typeof exports)b();else{b(),a.FileSaver={exports:{}}.exports}})(this,function(){"use strict";function b(a,b){return"undefined"==typeof b?b={autoBom:!1}:"object"!=typeof b&&(console.warn("Deprecated: Expected third argument to be a object"),b={autoBom:!b}),b.autoBom&&/^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(a.type)?new Blob(["\uFEFF",a],{type:a.type}):a}function c(b,c,d){var e=new XMLHttpRequest;e.open("GET",b),e.responseType="blob",e.onload=function(){a(e.response,c,d)},e.onerror=function(){console.error("could not download file")},e.send()}function d(a){var b=new XMLHttpRequest;b.open("HEAD",a,!1);try{b.send()}catch(a){}return 200<=b.status&&299>=b.status}function e(a){try{a.dispatchEvent(new MouseEvent("click"))}catch(c){var b=document.createEvent("MouseEvents");b.initMouseEvent("click",!0,!0,window,0,0,0,80,20,!1,!1,!1,!1,0,null),a.dispatchEvent(b)}}var f="object"==typeof window&&window.window===window?window:"object"==typeof self&&self.self===self?self:"object"==typeof global&&global.global===global?global:void 0,a=f.saveAs||("object"!=typeof window||window!==f?function(){}:"download"in HTMLAnchorElement.prototype?function(b,g,h){var i=f.URL||f.webkitURL,j=document.createElement("a");g=g||b.name||"download",j.download=g,j.rel="noopener","string"==typeof b?(j.href=b,j.origin===location.origin?e(j):d(j.href)?c(b,g,h):e(j,j.target="_blank")):(j.href=i.createObjectURL(b),setTimeout(function(){i.revokeObjectURL(j.href)},4E4),setTimeout(function(){e(j)},0))}:"msSaveOrOpenBlob"in navigator?function(f,g,h){if(g=g||f.name||"download","string"!=typeof f)navigator.msSaveOrOpenBlob(b(f,h),g);else if(d(f))c(f,g,h);else{var i=document.createElement("a");i.href=f,i.target="_blank",setTimeout(function(){e(i)})}}:function(a,b,d,e){if(e=e||open("","_blank"),e&&(e.document.title=e.document.body.innerText="downloading..."),"string"==typeof a)return c(a,b,d);var g="application/octet-stream"===a.type,h=/constructor/i.test(f.HTMLElement)||f.safari,i=/CriOS\/[\d]+/.test(navigator.userAgent);if((i||g&&h)&&"object"==typeof FileReader){var j=new FileReader;j.onloadend=function(){var a=j.result;a=i?a:a.replace(/^data:[^;]*;/,"data:attachment/file;"),e?e.location.href=a:location=a,e=null},j.readAsDataURL(a)}else{var k=f.URL||f.webkitURL,l=k.createObjectURL(a);e?e.location=l:location.href=l,e=null,setTimeout(function(){k.revokeObjectURL(l)},4E4)}});f.saveAs=a.saveAs=a,"undefined"!=typeof module&&(module.exports=a)});


}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}]},{},[9]);
