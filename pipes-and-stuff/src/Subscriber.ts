import { Queue } from './Queue'

export class Subscriber<T> {

    constructor(public id: string, private queue: Queue<T>) { }

    async pull(): Promise<T> {
        const message = await this.queue.dequeue()
        console.log("Subscriber " + this.id + " processed message: " + message)
        return message
    }
}

export class VentilatorSubscriber<T> {
    constructor(public id: string) { }

    sendMessage(message: T){
        console.log("Subscriber " + this.id + " processed message: " + message)
    }
}