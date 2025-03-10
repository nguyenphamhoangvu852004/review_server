import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn
} from 'typeorm'
import { BaseEntity } from '../shared/baseEntity'
import { Products } from './products.entity'
import { Users } from './users.entity'
import { Comments } from './comments.entity'

@Entity('reviews')
export class Reviews extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  public id!: string

  @Column({
    type: 'text'
  })
  public title!: string

  @Column({
    type: 'tinyint',
    default: 0
  })
  public rating!: number

  @Column({
    type: 'longtext'
  })
  public content!: string

  @ManyToOne(() => Products, (product) => product.reviews, {
    onDelete: 'CASCADE'
  })
  public product!: Products

  @ManyToOne(() => Users, (user) => user.reviews)
  public user!: Users

  // @OneToMany(() => Comments, (comment) => comment.reviews, {
  //   nullable: true
  // })
  // public comments: Comments
}
