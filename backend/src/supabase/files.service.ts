import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, EntityManager, Repository } from "typeorm";
import { File } from "./entities/file.entity";
import { CreateFileDto } from "./dto/create-file.response.dto";

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
}