import { Component, OnInit } from '@angular/core';
import { Client } from '@stomp/stompjs';
import * as SockJS from 'sockjs-client';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit {

  private client: Client;

  constructor() { }

  ngOnInit() {

    // create new stompjs client
    // will use sockjs which points to the endpoint declared back in our spring app (broker)
    this.client = new Client();
    this.client.webSocketFactory = () => new SockJS('http://localhost:8080/chat-websocket');

    // connect to the broker
    this.client.activate();

    // run function on connect
    this.client.onConnect = frame => console.log(`Conectados: ${this.client.connected} : ${frame}`);

  }

}
