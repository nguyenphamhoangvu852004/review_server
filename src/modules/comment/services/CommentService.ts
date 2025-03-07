import { CreateCommentRequestData } from '../request/CreateCommentRequestData'
import { ICommentDatabase } from '../databases/ICommentDatabase'
import { CreateCommentOutputDTO } from '../dtos/CreateCommentDTO'
import { CreateCommentResponseData } from '../response/CreateCommentResponseData'
import { ICommentService } from './ICommentService'
import { GetListCommentByReviewIdRequestData } from '../request/GetListCommentByReviewIdRequestData'
import { Comments } from '../../../entities/comments.entity'
import { GetListCommentByReviewIdOutputDTO } from '../dtos/GetListCommentByReviewIdDTO'
import { ICommentPresenter } from '../presenters/ICommentPresenter'
import { GetListCommentByReviewIdResponseData } from '../response/GetListCommentByReviewIdResponseData'
import { UpdateCommentRequestData } from '../request/UpdateCommentRequestData'
import { UpdateCommentOutputDTO } from '../dtos/UpdateCommentDTO'
import { UpdateCommentResponseData } from '../response/UpdateCommnetResponseData'

export class CommentService implements ICommentService {
  _commentPresenter: ICommentPresenter
  _commentDatabase: ICommentDatabase
  constructor(
    createCommentPresenter: ICommentPresenter,
    createCommentDatabase: ICommentDatabase
  ) {
    this._commentPresenter = createCommentPresenter
    this._commentDatabase = createCommentDatabase
  }
  async create(data: CreateCommentRequestData): Promise<void> {
    try {
      const user = await this._commentDatabase.findUser(data.data.userId)
    } catch (error) {
      const outputDTO = new CreateCommentOutputDTO()
      const resData = new CreateCommentResponseData(
        404,
        error.message,
        outputDTO
      )
      await this._commentPresenter.createCommentPresenter(resData)
      return
    }
    try {
      const review = await this._commentDatabase.findReview(data.data.reviewId)
    } catch (error) {
      const outputDTO = new CreateCommentOutputDTO()
      const resData = new CreateCommentResponseData(
        404,
        error.message,
        outputDTO
      )
      await this._commentPresenter.createCommentPresenter(resData)
      return
    }
    try {
      const comment = await this._commentDatabase.create(data.data)
      const outputDTO = new CreateCommentOutputDTO()
      const resData = new CreateCommentResponseData(201, 'Created success', outputDTO)
      await this._commentPresenter.createCommentPresenter(resData)
      return
    } catch (error) {
      const outputDTO = new CreateCommentOutputDTO()
      const resData = new CreateCommentResponseData(
        400,
        error.message,
        outputDTO
      )
      await this._commentPresenter.createCommentPresenter(resData)
      return
    }
  }

  async getListCommentByReviewId(
    data: GetListCommentByReviewIdRequestData
  ): Promise<void> {
    const { reviewId } = data.data

    try {
      const review = await this._commentDatabase.findReview(reviewId)
      if (!review) {
        const outputDTO = new GetListCommentByReviewIdOutputDTO([])
        const resData = new GetListCommentByReviewIdResponseData(
          400,
          'Review not found',
          outputDTO
        )
        await this._commentPresenter.getListCommentByReviewIdPresenter(resData)
        return
      }
    } catch (err) {
      const outputDTO = new GetListCommentByReviewIdOutputDTO([])
      const resData = new GetListCommentByReviewIdResponseData(
        400,
        err.message,
        outputDTO
      )
      await this._commentPresenter.getListCommentByReviewIdPresenter(resData)
      return
    }

    try {
      const comments =
        await this._commentDatabase.getListCommentByReviewId(reviewId)
      if (!comments || comments.length == 0) {
        const outputDTO = new GetListCommentByReviewIdOutputDTO([])
        const resData = new GetListCommentByReviewIdResponseData(
          400,
          'No Comment Found',
          outputDTO
        )
        await this._commentPresenter.getListCommentByReviewIdPresenter(resData)
        return
      }
      const tree = this.buildCommentTree(comments)
      const outputDTO = new GetListCommentByReviewIdOutputDTO(tree)
      const resData = new GetListCommentByReviewIdResponseData(
        200,
        'Success',
        outputDTO
      )
      await this._commentPresenter.getListCommentByReviewIdPresenter(resData)
      return
    } catch (err) {
      const outputDTO = new GetListCommentByReviewIdOutputDTO([])
      const resData = new GetListCommentByReviewIdResponseData(
        400,
        err.message,
        outputDTO
      )
      await this._commentPresenter.getListCommentByReviewIdPresenter(resData)
      return
    }
  }

  async update(data: UpdateCommentRequestData): Promise<void> {
    const { userId, reviewId, commentId, content } = data.data
    if(!content){
      const dto = new UpdateCommentOutputDTO()
      const resData = new UpdateCommentResponseData(400, 'Content is required', dto)
      await this._commentPresenter.updateCommentPresenter(resData)
      return
    }
    // Kiem tra User
    try {
      const response = await this._commentDatabase.findUser(userId)
    } catch (err) {
      const dto = new UpdateCommentOutputDTO()
      const resData = new UpdateCommentResponseData(404, err.message, dto)
      await this._commentPresenter.updateCommentPresenter(resData)
      return
    }

    // Kiem tra bai review
    try {
      const resposne = await this._commentDatabase.findReview(reviewId)
    } catch (err) {
      const dto = new UpdateCommentOutputDTO()
      const resData = new UpdateCommentResponseData(404, err.message, dto)
      await this._commentPresenter.updateCommentPresenter(resData)
      return
    }

    // kiem tra comment
    try {
      const comment = await this._commentDatabase.findComment(commentId)
    } catch (error) {
      const dto = new UpdateCommentOutputDTO()
      const resData = new UpdateCommentResponseData(404, error.message, dto)
      await this._commentPresenter.updateCommentPresenter(resData)
      return
    }

    // thuc hien cap nhat
    try {
      await this._commentDatabase.update(userId, commentId, content)

      const outputDTO = new CreateCommentOutputDTO()
      const resData = new CreateCommentResponseData(200, 'Success', outputDTO)
      await this._commentPresenter.updateCommentPresenter(resData)
      return
    } catch (error) {
      const outputDTO = new CreateCommentOutputDTO()
      const resData = new CreateCommentResponseData(
        400,
        error.message,
        outputDTO
      )
      await this._commentPresenter.updateCommentPresenter(resData)
      return
    }
  }

  buildCommentTree(comments: Comments[]): any[] {
    const commentMap = new Map<string, any>()
    const tree: any[] = []

    comments.forEach((comment) => {
      commentMap.set(comment.id, {
        id: comment.id,
        text: comment.text,
        user: {
          id: comment.user.id,
          name: comment.user.username
        },
        children: []
      })
    })

    comments.forEach((comment) => {
      const mappedComment = commentMap.get(comment.id)
      if (comment.parent) {
        const parent = commentMap.get(comment.parent.id)
        if (parent) {
          parent.children.push(mappedComment)
        }
      } else {
        tree.push(mappedComment) // Nếu không có cha, đây là node gốc
      }
    })

    return tree
  }
}
