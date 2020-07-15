import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { Repository } from "typeorm";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import User from "../users/user.entity";
import Chat from "./chat.entity";
import Posting from "../postings/posting.entity";
import Message from "../messages/message.entity";
import { SendMessageArgs } from "../interfaces";

@Injectable()
export class ChatsService {
  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    @InjectRepository(Chat) private readonly chatsRepository: Repository<Chat>,
    @InjectRepository(Posting)
    private readonly postingsRepository: Repository<Posting>,
    @InjectRepository(Message)
    private readonly messagesRepository: Repository<Message>,
  ) {}

  async sendMessage({
    chatId,
    userId,
    sendMessageDto,
  }: SendMessageArgs): Promise<Message> {
    const chat = await this.chatsRepository.findOne(chatId, {
      relations: ["users"],
    });

    if (!chat)
      throw new HttpException(
        "Chat with this id not found",
        HttpStatus.NOT_FOUND,
      );

    const amIMember = chat.users.map((user) => user.id).includes(userId);
    if (!amIMember)
      throw new HttpException(
        "You are not the member of the chat",
        HttpStatus.NOT_FOUND,
      );

    // cast as User because already checked above that users array includes me
    const me = chat.users.find((user) => user.id === userId) as User;

    const message = this.messagesRepository.create({
      ...sendMessageDto,
      user: me,
      chat,
    });

    const savedMessage = await this.messagesRepository.save(message);

    return savedMessage;
  }

  private async getLastMessage(chat: Chat): Promise<Message | undefined> {
    const message = await this.messagesRepository.findOne({
      where: { chat },
      order: { sentTime: "DESC" },
    });
    return message;
  }

  async getAllChats(userId: string): Promise<Chat[]> {
    const user = await this.usersRepository.findOne(userId, {
      relations: ["chats", "chats.posting"],
    });

    if (!user) throw new NotFoundException();

    const { chats } = user;

    // get last message for the chat preview
    const chatsLastMessages = await Promise.all(
      chats.map((chat) => this.getLastMessage(chat)),
    );

    chats.forEach((chat, i) => {
      const lastMessage = chatsLastMessages[i];

      if (lastMessage) {
        chat.messages = [lastMessage];
      }
    });

    // filter out chats that are empty, it surely can be better designed, no time for now
    const nonEmptyChats = chats.filter((chat) => chat.messages);

    return nonEmptyChats;
  }

  async getChat(postingId: string, userId: string): Promise<Chat> {
    const posting = await this.postingsRepository.findOne(postingId, {
      relations: ["user", "chats", "chats.users"],
    });

    if (!posting) throw new NotFoundException();

    const { user: postingOwner, chats: postingChats } = posting;

    const chat = postingChats.find((chat) => {
      const userIds = chat.users.map((user) => user.id);
      return userIds.includes(userId);
    });

    if (chat) {
      const fullChat = await this.chatsRepository.findOne(chat.id, {
        relations: ["messages", "posting", "posting.user"],
      });

      // because it's got just created
      if (!fullChat) throw new InternalServerErrorException();

      return fullChat;
    }

    // chat doesn't exist so create a new one

    // can't message self check first
    if (posting.user.id === userId) throw new ForbiddenException();

    const me = await this.usersRepository.findOne(userId);
    if (!me)
      throw new HttpException(
        "User with this id doesn't exist",
        HttpStatus.NOT_FOUND,
      );

    const createdChat = this.chatsRepository.create({
      posting,
      users: [me, postingOwner],
      messages: [],
    });

    return await this.chatsRepository.save(createdChat);
  }
}
