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

  public escribiendo: string;

  public clienteId: string;

  constructor() {
    this.clienteId = `id-${new Date().getUTCMilliseconds()}-${Math.random().toString(36).substr(2)}`;
  }

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

        if (
          !this.mensaje.color &&
          mensaje.tipo === 'NUEVO_USUARIO' &&
          this.mensaje.username === mensaje.username
        ) {
          this.mensaje.color = mensaje.color;
        }

        this.mensajes.push(mensaje);
        console.log(mensaje);

      });

      this.client.subscribe('/chat/escribiendo', e => {
        this.escribiendo = e.body;
        setTimeout(() => this.escribiendo = null, 3000);
      });

      this.client.publish({
        destination: '/app/historial',
        body: this.clienteId
      });

      this.client.subscribe(`/chat/historial/${this.clienteId}`, e => {

        const historial: Mensaje[] = JSON.parse(e.body);

        this.mensajes = historial.map(mensaje => {
          mensaje.fecha = new Date(mensaje.fecha);
          return mensaje;
        }).reverse();

      });

      this.mensaje.tipo = 'NUEVO_USUARIO';

      this.client.publish({
        destination: '/app/mensaje',
        body: JSON.stringify(this.mensaje)
      });

    };

    // run function on disconnect
    this.client.onDisconnect = frame => {

      console.log(`Desconectados: ${!this.client.connected} : ${frame}`);

      this.conectado = false;
      this.mensaje = new Mensaje();
      this.mensajes = [];

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

    this.mensaje.tipo = 'MENSAJE';

    // send message to broker to /app/mensaje
    // server listens to this destination through @MessageMapping
    this.client.publish({
      destination: '/app/mensaje',
      body: JSON.stringify(this.mensaje)
    });

    this.mensaje.texto = '';

  }

  // send data to @MessageMapping("/app/escribiendo")
  escribiendoEvento(): void {
    this.client.publish({
      destination: '/app/escribiendo',
      body: this.mensaje.username
    });
  }

}
