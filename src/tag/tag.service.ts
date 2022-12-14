import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    InternalServerErrorException,
} from '@nestjs/common';
import { Tag } from 'src/interfaces/Tag.interface';
import { TagInfo } from 'src/interfaces/TagInfo.interface';
import { AddTagsDto } from 'src/user/dto/add-tags.dto';
import { CreateTagDto } from './dto/create-tag.dto';
import { FindTagParams } from './dto/find-tags-query-params.dto';
import { TagRepository } from './tag.repository';
import {
    UNKOWN_INTERNAL_ERROR,
    TAGNAME_EXISTS,
    NO_RIGHTS,
    WRONG_ARGUMENTS,
    ITEM_DELETED,
    ARGUMENT_ADDED,
} from '../constants';
import { UserService } from 'src/user/user.service';

@Injectable()
export class TagService {
    constructor(private tagRepository: TagRepository, private userService: UserService) {}

    async createTag(createTagDto: CreateTagDto, creator: string): Promise<Omit<Tag, 'creator'>> {
        const candidateTag = await this.tagRepository.getByName(createTagDto.name);

        if (candidateTag) {
            throw new BadRequestException(TAGNAME_EXISTS);
        }

        return this.tagRepository.create({
            creator,
            name: createTagDto.name,
            sort_order: createTagDto.sort_order,
        });
    }
    async getTagInfoById(id: string): Promise<TagInfo> {
        try {
            return this.tagRepository.findInfoById(id);
        } catch (error) {
            throw new InternalServerErrorException(UNKOWN_INTERNAL_ERROR);
        }
    }
    async getTagsByQueryParams(params: FindTagParams) {
        try {
            const result = await this.tagRepository.findWithParams(params);
            return result;
        } catch (error) {
            throw new InternalServerErrorException(UNKOWN_INTERNAL_ERROR);
        }
    }
    async changeTag(id: string, createTagDto: CreateTagDto, creator: string): Promise<TagInfo> {
        const tagToChange: Tag = await this.tagRepository.findById(id);
        console.log(tagToChange.creator, creator);
        if (tagToChange.creator === creator) {
            if (await this.tagRepository.getByName(createTagDto.name)) {
                throw new BadRequestException(TAGNAME_EXISTS);
            }
            await this.tagRepository.update({ id, ...createTagDto });
            const tagInfo = await this.tagRepository.findInfoById(id);
            return tagInfo;
        }
        throw new ForbiddenException(NO_RIGHTS);
    }
    async getUserTags(uid: string) {
        try {
            const result = await this.tagRepository.findManyByCreator(uid);
            return result;
        } catch (error) {
            throw new InternalServerErrorException(UNKOWN_INTERNAL_ERROR);
        }
    }
    async addTagsByIds(uid: string, addTagsDto: AddTagsDto) {
        const tagsResult: Omit<Tag, 'creator'>[] = await (
            await this.userService.getAddedTags(uid)
        ).tags;
        tagsResult.map((item) => {
            if (addTagsDto.tags.includes(item.id)) {
                throw new BadRequestException(ARGUMENT_ADDED);
            }
        });
        try {
            await this.tagRepository.addTagsToUser(uid, addTagsDto);
        } catch (error) {
            throw new BadRequestException(WRONG_ARGUMENTS);
        }
        return await this.userService.getAddedTags(uid);
    }
    async removeAddedTagById(uid: string, id: string) {
        const isAdded = await this.tagRepository.isTagAdded(uid, id);
        if (!isAdded) {
            throw new BadRequestException(ITEM_DELETED);
        }
        const result = await this.tagRepository.removeTagFromUser(uid, id);

        if (result == 1) {
            return await this.userService.getAddedTags(uid);
        }
        throw new InternalServerErrorException(UNKOWN_INTERNAL_ERROR);
    }
}
