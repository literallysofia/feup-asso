import { SimpleDrawDocument } from 'document';
import { Render } from './render';
import { Selection } from './selection';
import { Shape, Rectangle, Circle, ShapeStyle } from './shape';

export abstract class Tool {
    constructor(protected render: Render, protected doc: SimpleDrawDocument) { }
    abstract createTool(lastRenderId: number): Element;
}

export class Zoom extends Tool {

    increaseZoom(): void {
        this.render.increaseZoom(2)
    }

    decreaseZoom(): void {
        this.render.decreaseZoom(2)
    }

    createTool(): Element {
        const zoomContainer = document.createElement('div')

        const buttonGroup = document.createElement('div')
        buttonGroup.className = "btn-group"

        const buttonZoomIn = document.createElement('button')
        buttonZoomIn.className = "btn btn-dark"

        const iconZoomIn = document.createElement('i')
        iconZoomIn.className = "fas fa-search-plus"
        buttonZoomIn.appendChild(iconZoomIn)

        buttonZoomIn.addEventListener("click", (e: Event) => { this.increaseZoom(); this.doc.draw(this.render) })

        const buttonZoomOut = document.createElement('button')
        buttonZoomOut.className = "btn btn-dark"

        const iconZoomOut = document.createElement('i')
        iconZoomOut.className = "fa fa-search-minus"
        buttonZoomOut.appendChild(iconZoomOut)

        buttonZoomOut.addEventListener("click", (e: Event) => { this.decreaseZoom(); this.doc.draw(this.render) })

        buttonGroup.appendChild(buttonZoomIn)
        buttonGroup.appendChild(buttonZoomOut)
        zoomContainer.appendChild(buttonGroup)

        return zoomContainer
    }
}

export class Translate extends Tool {

    static setPositionSelection(doc: SimpleDrawDocument, x: number, y: number): boolean {
        let selected = false;
        for (let shape of Selection.getInstance().selectedObjects){
            doc.translate(shape, x, y);
            selected = true;
        }
        return selected;
    }

    setPosition(x: number, y: number): void {
        if (!Translate.setPositionSelection(this.doc, x, y)) {
            this.render.setX(x);
            this.render.setY(y);
        }            
    }

    createTool(): Element {
        const translateContainer = document.createElement('div')

        const buttonGroup = document.createElement('div')
        buttonGroup.className = "btn-group"

        const buttonUp = document.createElement('button')
        buttonUp.className = "btn btn-dark"
        buttonUp.innerHTML = "up"
        buttonUp.addEventListener("click", (e: Event) => { this.setPosition(0, -10); this.doc.draw(this.render) })

        const buttonLeft = document.createElement('button')
        buttonLeft.className = "btn btn-dark"
        buttonLeft.innerHTML = "left"
        buttonLeft.addEventListener("click", (e: Event) => { this.setPosition(-10, 0); this.doc.draw(this.render) })

        const buttonDown = document.createElement('button')
        buttonDown.className = "btn btn-dark"
        buttonDown.innerHTML = "down"
        buttonDown.addEventListener("click", (e: Event) => { this.setPosition(0, 10); this.doc.draw(this.render) })

        const buttonRight = document.createElement('button')
        buttonRight.className = "btn btn-dark"
        buttonRight.innerHTML = "right"
        buttonRight.addEventListener("click", (e: Event) => { this.setPosition(10, 0); this.doc.draw(this.render) })

        buttonGroup.appendChild(buttonLeft)
        buttonGroup.appendChild(buttonUp)
        buttonGroup.appendChild(buttonDown)
        buttonGroup.appendChild(buttonRight)
        translateContainer.appendChild(buttonGroup)

        return translateContainer
    }
}

export class Style extends Tool {

    setStyle (style: ShapeStyle) {
        this.render.shapeStyle = style
    }

    createTool(): Element {
        var options = ["Default", "Wireframe", "Color"]

        const select = document.createElement('select')
        select.className = "viewport-style"

        for (var i = 0; i < options.length; i++) {
            var option = document.createElement("option");
            option.value = options[i];
            option.text = options[i];
            select.appendChild(option);
        }


        select.addEventListener("change", (e: Event) => { 
            
            if(select.value === "Color"){
                this.setStyle(ShapeStyle.Color)
            }
            else if(select.value === "Wireframe"){
                this.setStyle(ShapeStyle.Wireframe)
            }
            else{
                this.setStyle(ShapeStyle.Default)
            }
            
            this.doc.draw(this.render)
        })

        return select
    }
}

export class Rotate extends Tool {

    static rotateSelection(doc: SimpleDrawDocument, deg: number): boolean {
        let selected = false;
        for (let shape of Selection.getInstance().selectedObjects){
            doc.rotate(shape, deg);
            selected = true;
        }
        return selected;
    }

    createTool(): Element {
        const rotateContainer = document.createElement('div')

        const buttonGroup = document.createElement('div')
        buttonGroup.className = "btn-group"

        const button45 = document.createElement('button')
        button45.className = "btn btn-secondary"
        button45.innerHTML = "45°"
        button45.addEventListener("click", (e: Event) => { Rotate.rotateSelection(this.doc, 45); })

        const button90 = document.createElement('button')
        button90.className = "btn btn-secondary"
        button90.innerHTML = "90°"
        button90.addEventListener("click", (e: Event) => { Rotate.rotateSelection(this.doc, 90); })

        const button_minus45 = document.createElement('button')
        button_minus45.className = "btn btn-secondary"
        button_minus45.innerHTML = "-45°"
        button_minus45.addEventListener("click", (e: Event) => { Rotate.rotateSelection(this.doc, -45);})

        const button_minus90 = document.createElement('button')
        button_minus90.className = "btn btn-secondary"
        button_minus90.innerHTML = "-90°"
        button_minus90.addEventListener("click", (e: Event) => { Rotate.rotateSelection(this.doc, -90);})

        buttonGroup.appendChild(button45)
        buttonGroup.appendChild(button90)
        buttonGroup.appendChild(button_minus45)
        buttonGroup.appendChild(button_minus90)
        rotateContainer.appendChild(buttonGroup)

        return rotateContainer
    }
}