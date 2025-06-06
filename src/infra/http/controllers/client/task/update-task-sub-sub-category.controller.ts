import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";

import { ApiTags } from "@nestjs/swagger";

import { z } from "zod";
import { ResourceNotFoundError } from "@/core/errors";
import { JwtAuthGuard } from "@/infra/auth/jwt-auth.guard";
import { AuthPayload } from "@/infra/auth/jwt.strategy";
import { AuthenticatedUser } from "@/infra/auth/authenticated-user-decorator";
import { ValidationService } from "@/infra/http/pipes/validation.service";
import { UpdateTaskSubSubCategoryIdUseCase } from "@/domain/work/application/use-case/tasks/update-sub-sub-category-id";

const updateTaskServiceBodySchema = z.object({
  sub_sub_category_id: z.string({
    invalid_type_error: "task.service_id.invalid_type_error",
    required_error: "task.service_id.invalid_type_error"
  }),
});

type UpdateTaskServiceBodySchema = z.infer<typeof updateTaskServiceBodySchema>

@ApiTags("Tasks")
@Controller("/tasks")
@UseGuards(JwtAuthGuard)
export class UpdateTaskSubSubCategoryController {
  constructor(
    private updateTaskSubSubCategoryIdUseCase: UpdateTaskSubSubCategoryIdUseCase,
    private validation: ValidationService
  ) { }

  @Post("/:taskId/sub-sub-category")
  async handle(
    @Headers() headers: Record<string, string>,
    @AuthenticatedUser() user: AuthPayload,
    @Param("taskId") taskId: string,
    @Body() data: UpdateTaskServiceBodySchema,
  ) {
    try {
      await this.validation.validateData(updateTaskServiceBodySchema, data);
    } catch (error) {
      throw new BadRequestException({ errors: error });
    }

    const result = await this.updateTaskSubSubCategoryIdUseCase.execute({
      language: headers["accept-language"] == "en" ? "en" : "pt",
      userId: user.sub,
      subSubCategoryId: data.sub_sub_category_id,
      taskId
    });

    if (result.isLeft()) {
      const error = result.value;

      if (error.constructor === ResourceNotFoundError)
        throw new NotFoundException();

      throw new BadRequestException(error.message);
    }
  }
}