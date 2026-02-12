import { pdf } from '@react-pdf/renderer';
import type { ReactElement } from 'react';
import type { Readable } from 'stream';

const isReadable = (v: any): v is Readable => v && typeof v.on === 'function' && typeof v.pipe === 'function';

const toNodeBuffer = (out: any): Buffer | null => {
  if (!out) return null;
  if (Buffer.isBuffer(out)) return out;
  if (out instanceof ArrayBuffer) return Buffer.from(out);
  if (ArrayBuffer.isView(out)) return Buffer.from(out as Uint8Array);
  return null;
};

const streamToBuffer = async (stream: Readable): Promise<Buffer> => {
  const chunks: Buffer[] = [];
  await new Promise<void>((resolve, reject) => {
    stream.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
    stream.on('end', resolve);
    stream.on('error', reject);
  });

  return Buffer.concat(chunks);
};

const maybeEndPdfDocument = (doc: any) => {
  const alreadyEnded = doc?.readableEnded === true || doc?._ended === true || doc?._readableState?.ended === true;

  if (!alreadyEnded && typeof doc?.end === 'function') doc.end();
};

export const bufferFromReactPdf = async (element: ReactElement): Promise<Buffer> => {
  const instance: any = pdf(element as any);

  if (typeof instance.toArrayBuffer === 'function') {
    const ab: ArrayBuffer = await instance.toArrayBuffer();
    return Buffer.from(ab);
  }

  if (typeof instance.toBuffer === 'function') {
    const out = await instance.toBuffer();
    const b = toNodeBuffer(out);
    if (b) return b;
    if (isReadable(out)) {
      const p = streamToBuffer(out);
      maybeEndPdfDocument(out);
      return await p;
    }
  }

  if (typeof instance.toStream === 'function') {
    const stream = await instance.toStream();
    if (isReadable(stream)) return await streamToBuffer(stream);
  }

  throw new Error('React-PDF could not produce a PDF buffer in this runtime (Node.js required).');
}