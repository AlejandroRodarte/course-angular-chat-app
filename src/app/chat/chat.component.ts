import { Component, OnInit } from '@angular/core';
import { Client } from '@stomp/stompjs';
import * as SockJS from 'sockjs-client';
import { Mensaje } from './models/mensaje';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit {

  private client: Client;

  public conectado = false;

  public mensaje: Mensaje = new Mensaje();

  public mensajes: Mensaje[] = [];

  constructor() { }

  ngOnInit() {

    // create new stompjs client
    // will use sockjs which points to the endpoint declared back in our spring app (broker)
    this.client = new Client();
    this.client.webSocketFactory = () => new SockJS('http://localhost:8080/chat-websocket');

    // run function on connect
    this.client.onConnect = frame => {

      console.log(`Conectados: ${this.client.connected} : ${frame}`);
      this.conectado = true;

      // subscribe to /chat/mensaje whenever the spring broker sends information through it (@SendTo)
      this.client.subscribe('/chat/mensaje', e => {

        // from the event body we can get the payload
        const mensaje: Mensaje = JSON.parse(e.body);

        mensaje.fecha = new Date(mensaje.fecha);

        this.mensajes.push(mensaje);
        console.log(mensaje);

      });

    };

    // run function on disconnect
    this.client.onDisconnect = frame => {
      console.log(`Desconectados: ${!this.client.connected} : ${frame}`);
      this.conectado = false;
    };

  }

  conectar(): void {
    // connect to the broker
    this.client.activate();
  }

  desconectar(): void {
    // disconnect from the broker
    this.client.deactivate();
  }

  enviarMensaje(): void {

    // send message to broker to /app/mensaje
    // server listens to this destination through @MessageMapping
    this.client.publish({
      destination: '/app/mensaje',
      body: JSON.stringify(this.mensaje)
    });

    this.mensaje.texto = '';

  }

}
