import {  Column, Entity, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

@Entity('profiles')
export class Profile {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ nullable: true })
  full_name!: string;

  @Column({ type: 'enum', enum: Gender, nullable: true })
  sex!: Gender;

  @Column({ nullable: true, type: 'date' })
  date_of_birth!: Date;

  @Column({ nullable: true })
  avatar_url!: string;

  @Column({ nullable: true })
  cover_url!: string;

  @Column({ type: 'text', nullable: true })
  bio!: string;

  @OneToOne(() => User, (user) => user.profile)
  user!: User;
}
