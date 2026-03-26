import { User } from "../../users/entities/user.entity";
import { Column, Entity, JoinColumn, PrimaryGeneratedColumn, ManyToOne, Index } from "typeorm";

export enum VerificationCodeType {
  EMAIL_VERIFICATION = 'email_verification',
  PASSWORD_RESET = 'password_reset',
}

@Entity('verification_codes')
export class VerificationCode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  user_id: string;

  @Index()
  @Column()
  code: string;

  @Column({ type: 'enum', enum: VerificationCodeType })
  type: VerificationCodeType;

  @Column({ default: false })
  is_used: boolean;

  @Column({ default: 0 })
  attempts_count: number;

  @Index()
  @Column({ type: 'timestamp' })
  expires_at: Date;

  @ManyToOne(() => User, (user) => user.verificationCodes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
