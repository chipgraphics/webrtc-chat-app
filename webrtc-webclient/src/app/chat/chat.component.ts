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
    this.chatService.onNewMessage().subscribe((msg) => {
      this.messages.push(`${msg}`);
    });
  }
  ngAfterViewChecked() {
    this.scrollToBottom();
  }
  sendButtonClick() {
    if (this.msgInput !== '') {
      this.chatService.sendMessage(this.msgInput);
      this.messages.push(`You: ${this.msgInput}`);
      this.msgInput = '';
    }
  }
  scrollToBottom(): void {
    try {
      this.scrollContainer.nativeElement.scrollTop =
        this.scrollContainer.nativeElement.scrollHeight;
    } catch (err) {}
  }
}
