import { BeforeInsert, Column, Entity, OneToOne, PrimaryColumn } from 'typeorm';
import { User } from './user.entity';
import { v7 as uuidv7 } from 'uuid';

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

@Entity('profiles')
export class Profile {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ nullable: true })
  full_name: string;

  @Column({ type: 'enum', enum: Gender, nullable: true })
  sex: Gender

  @Column({ nullable: true, type: 'date' })
  date_of_birth: Date;

  @Column({ nullable: true })
  avatar_url: string;

  @Column({ nullable: true })
  cover_url: string;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @OneToOne(() => User, (user) => user.profile)
  user: User;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = uuidv7();
    }
  }
}

