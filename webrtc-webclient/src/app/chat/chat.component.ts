import {
  AfterViewChecked,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ChatService } from '../chat.service';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
})
export class ChatComponent implements OnInit, AfterViewChecked {
  @ViewChild('scroll')
  private scrollContainer!: ElementRef;
  msgInput: string = '';
  htmlToAdd: string | undefined;
  messages: string[] = [];
  constructor(private chatService: ChatService) {}

  ngOnInit(): void {
    this.chatService.getMessage().subscribe((msg) => {
      this.messages.push(`${msg}`);
    });
  }
  ngAfterViewChecked() {
    this.scrollToBottom();
  }
  sendButtonClick() {
    const connectionState = this.chatService.getConnectionState();
    if (this.msgInput !== '') {
      if (connectionState === true) {
        this.chatService.sendMessage(this.msgInput);
        this.messages.push(`You: ${this.msgInput}`);
        this.msgInput = '';
      } else {
        this.messages.push(
          'Server: Please wait for the connection, you will be notified when other peer joined'
        );
      }
    }
  }
  scrollToBottom(): void {
    try {
      this.scrollContainer.nativeElement.scrollTop =
        this.scrollContainer.nativeElement.scrollHeight;
    } catch (err) {}
  }
}
