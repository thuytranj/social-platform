import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, EntityManager, Repository } from "typeorm";
import { File } from "./entities/file.entity";
import { CreateFileDto } from "./dto/create-file.response.dto";
import { FileResponseDto } from "./dto/file-response.dto";
import { plainToInstance } from "class-transformer";
import { MessageType } from "@/conversations/entities/message.entity";

@Injectable()
export class FilesService {
  constructor (
    @InjectRepository(File) 
    private readonly postsRepository: Repository<File>,
    private readonly dataSource: DataSource
  ) {}

  private getFileRepository(manager?: EntityManager) {
    return manager?.getRepository(File) ?? this.postsRepository;
  }

  private executeTransaction<T> (
    manager: EntityManager | undefined,
    callback: (transactionManager: EntityManager) => Promise<T>,
  ) {
    return manager ? callback(manager) : this.dataSource.transaction(callback)
  }

  async create(createFileDto: CreateFileDto, manager?: EntityManager) {
    return this.executeTransaction(manager, async (transactionManager) => {
      const fileRepo = this.getFileRepository(transactionManager)
      const newFile = fileRepo.create(createFileDto)
      return await fileRepo.save(newFile)
    })
  }

  async delete(id: string, manager?: EntityManager) {
    return this.executeTransaction(manager, async (transactionManager) => {
      const fileRepo = this.getFileRepository(transactionManager)
      return await fileRepo.delete(id)
    })
  }

  async getConversationFiles(conversationId: string, userId: string, limit: number = 20, cursor?: string) {
    const fileRepo = this.getFileRepository()
    
    const query = fileRepo.createQueryBuilder('files')
      .innerJoin('files.message', 'message')
      .andWhere('message.conversation_id = :conversationId', { conversationId })
      .andWhere('message.message_type != :messageType', { messageType: MessageType.REVOKED })
      .select('files.id', 'id')
      .addSelect('files.created_at::text', 'created_at')
      .orderBy('files.created_at', 'DESC')
      .addOrderBy('files.id', 'DESC')
      .limit(limit + 1);
    
    if (cursor) {
      const { created_at, id } = JSON.parse(Buffer.from(cursor, 'base64').toString('utf8')) as { created_at: string, id: string };
      query.andWhere(
        `(files.created_at < :created_at OR (files.created_at = :created_at AND files.id < :id))`,
        { created_at, id }
      );
    }
    
    const idsResult = await query.getRawMany()
    if (idsResult.length===0) return {data: [], nextCursor: null}
    
    let nextCursor: string | null = null;
    if (idsResult.length > limit) {
      idsResult.pop();
      const lastReturnedFile = idsResult[idsResult.length - 1];
      if (lastReturnedFile) {
        nextCursor = Buffer.from(
          JSON.stringify({
            created_at: lastReturnedFile.created_at,
            id: lastReturnedFile.id,
          }),
        ).toString('base64');
      }
    }

    const files = await fileRepo.createQueryBuilder('files')
      .andWhere('files.id IN (:...ids)', { ids: idsResult.map((file) => file.id) })
      .orderBy('array_position(ARRAY[:...ids]::uuid[], files.id)')
      .getMany()
    
    return { data: files.map(file => plainToInstance(FileResponseDto, file, { excludeExtraneousValues: true })), nextCursor }
  }
}