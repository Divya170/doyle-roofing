import { Body, Controller, Delete, Get, Headers, HttpCode, Logger, Param, ParseIntPipe, Patch, Post, Query, Req, Res, UploadedFile, UseFilters, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { memoryStorage } from 'multer';
import type { Request, Response } from 'express';
import { InquiriesService, MAX_PHOTO_BYTES } from './inquiries.service';
import { cleanIdemKey, REQUEST_STATUSES } from '../common/forms';
import { SubmissionExceptionFilter } from '../common/submission-error';
import { AuthedRequest, SessionGuard } from '../common/session';
import { RequestQuery } from '../common/request-query';

export const rateMax = () => Math.max(1, Number(process.env.RATE_LIMIT_MAX) || 5);
export const rateWindowMs = () => Math.max(1, Number(process.env.RATE_LIMIT_WINDOW_MIN) || 10) * 60_000;

/** Public: the "Request an estimate" wizard. Handoff: POST /api/estimates. */
@Controller('estimates')
@UseFilters(SubmissionExceptionFilter)
export class EstimatesController {
  constructor(private readonly estimates: InquiriesService) {}

  @Get('options')
  options() {
    return this.estimates.formOptions();
  }

  /** 201 {id} · 200 {id} for an Idempotency-Key replay · 422 {errors} · 429 · 503 · 500 */
  @Post()
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: rateMax, ttl: rateWindowMs } })
  async create(@Body() body: Record<string, unknown>, @Headers('idempotency-key') idem: string | undefined, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const r = await this.estimates.submit(body || {}, { ip: req.ip || '', idemKey: cleanIdemKey(idem) });
    res.status(r.duplicate ? 200 : 201);
    return { ok: true, id: r.id };
  }

  /** Step 3 photo: multipart field "file" → { id }. Checked by magic bytes; stored privately. */
  @Post('photos')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 30, ttl: 10 * 60_000 } })
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: MAX_PHOTO_BYTES, files: 1 } }))
  photo(@UploadedFile() file: Express.Multer.File | undefined, @Req() req: Request) {
    return this.estimates.uploadPhoto(file, req.ip || '');
  }
}

export class UpdateRequestDto {
  @IsOptional() @IsIn(REQUEST_STATUSES as unknown as string[], { message: 'Choose a valid status.' }) status?: string;
  @IsOptional() @IsString() @MaxLength(5000, { message: 'Keep notes under 5,000 characters.' }) notes?: string;
}

@Controller('admin/estimates')
@UseGuards(SessionGuard)
export class AdminEstimatesController {
  private readonly audit = new Logger('EstimateAccess');
  constructor(private readonly estimates: InquiriesService) {}

  @Get()
  list(@Req() req: AuthedRequest, @Query() q: RequestQuery) {
    this.audit.log(JSON.stringify({ event: 'estimates.list', admin: req.admin.sub }));
    return this.estimates.list(q);
  }

  @Get('counts')
  counts() {
    return this.estimates.counts();
  }

  @Get('export.csv')
  async export(@Req() req: AuthedRequest, @Res() res: Response, @Query() q: RequestQuery) {
    this.audit.log(JSON.stringify({ event: 'estimates.export', admin: req.admin.sub }));
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="doyle-estimates-${new Date().toISOString().slice(0, 10)}.csv"`);
    res.send('﻿' + (await this.estimates.exportCsv(q)));
  }

  @Get(':id')
  get(@Req() req: AuthedRequest, @Param('id', ParseIntPipe) id: number) {
    this.audit.log(JSON.stringify({ event: 'estimate.view', admin: req.admin.sub, id }));
    return this.estimates.detail(id);
  }

  /** Attached photo — admin session only, never public. */
  @Get(':id/photos/:photoId')
  async photo(@Param('id', ParseIntPipe) id: number, @Param('photoId') photoId: string, @Query('download') download: string | undefined, @Res() res: Response) {
    const f = await this.estimates.photoFile(id, String(photoId).replace(/[^a-f0-9]/g, ''));
    res.setHeader('Content-Type', f.mime);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('Content-Disposition', `${download ? 'attachment' : 'inline'}; filename="${f.name.replace(/[^\w.\- ]/g, '_')}"`);
    res.sendFile(f.path);
  }

  @Patch(':id')
  update(@Req() req: AuthedRequest, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateRequestDto) {
    this.audit.log(JSON.stringify({ event: 'estimate.update', admin: req.admin.sub, id, fields: Object.keys(dto) }));
    return this.estimates.update(id, dto, req.admin.email);
  }

  @Post(':id/notify')
  @HttpCode(200)
  resend(@Param('id', ParseIntPipe) id: number) {
    return this.estimates.resend(id);
  }

  @Delete(':id')
  remove(@Req() req: AuthedRequest, @Param('id', ParseIntPipe) id: number) {
    this.audit.log(JSON.stringify({ event: 'estimate.delete', admin: req.admin.sub, id }));
    return this.estimates.remove(id);
  }
}
