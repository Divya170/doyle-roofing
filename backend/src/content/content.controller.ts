import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ArrayNotEmpty, IsArray, IsBoolean, IsInt, IsObject, IsOptional, IsString } from 'class-validator';
import { ContentService } from './content.service';
import { SessionGuard } from '../common/session';
import { SettingsService } from '../settings/settings.service';
import { ProjectsService } from '../projects/projects.service';

class CreateContentDto {
  @IsString() type: string;
  @IsObject() fields: Record<string, unknown>;
  @IsOptional() @IsBoolean() published?: boolean;
}

class UpdateContentDto {
  @IsOptional() @IsObject() fields?: Record<string, unknown>;
  @IsOptional() @IsBoolean() published?: boolean;
}

class ReorderContentDto {
  @IsString() type: string;
  @IsArray() @ArrayNotEmpty() @IsInt({ each: true }) ids: number[];
}

type Row = Record<string, unknown>;
const str = (v: unknown) => (v === null || v === undefined ? '' : String(v));

@Controller()
export class SiteController {
  constructor(
    private readonly settings: SettingsService,
    private readonly content: ContentService,
    private readonly projects: ProjectsService,
  ) {}

  /** Everything the public pages render, in one call. */
  @Get('site')
  async site() {
    const settings = await this.settings.getPublic();
    const c = await this.content.publicBundle(['service', 'step', 'faq', 'form-option']);
    // FAQ answers may reference the live business details.
    const fill = (t: string) =>
      t
        .replace(/\{phone\}/g, settings.phone || 'the workshop phone number')
        .replace(/\{email\}/g, settings.email || 'email')
        .replace(/\{address\}/g, settings.address || 'our office');
    const svc = (cat: string) =>
      c.service.filter((x: Row) => x.category === cat).map((x: Row) => ({ id: Number(x.id), name: str(x.name), need: str(x.need), image: str(x.image) || null, alt: str(x.alt) }));
    const faq = (g: string) => c.faq.filter((x: Row) => x.group === g).map((x: Row) => ({ id: Number(x.id), q: str(x.q), a: fill(str(x.a)) }));
    const opts = (list: string) => c['form-option'].filter((x: Row) => x.list === list).map((x: Row) => ({ label: str(x.label), icon: str(x.icon) }));
    return {
      settings,
      services: { roofing: svc('roofing'), remodeling: svc('remodeling') },
      steps: c.step.map((x: Row) => ({ id: Number(x.id), title: str(x.title), body: str(x.body) })),
      faqs: { roofing: faq('roofing'), remodeling: faq('remodeling'), general: faq('general') },
      options: {
        property: opts('property'),
        timeline: opts('timeline'),
        budget: opts('budget'),
        roofIssue: opts('roof-issue'),
        roofAge: opts('roof-age'),
        remodelArea: opts('remodel-area'),
      },
      projects: await this.projects.listPublished(),
      images: await this.content.siteImages(),
    };
  }
}

@Controller('admin/content')
@UseGuards(SessionGuard)
export class ContentController {
  constructor(private readonly content: ContentService) {}

  @Get('types')
  types() {
    return this.content.types();
  }

  @Get('counts')
  counts() {
    return this.content.counts();
  }

  @Get()
  adminList(@Query('type') type: string) {
    return this.content.adminList(type);
  }

  @Post('reorder')
  reorder(@Body() dto: ReorderContentDto) {
    return this.content.reorder(dto.type, dto.ids);
  }

  @Post()
  create(@Body() dto: CreateContentDto) {
    return this.content.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateContentDto) {
    return this.content.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.content.remove(id);
  }
}
