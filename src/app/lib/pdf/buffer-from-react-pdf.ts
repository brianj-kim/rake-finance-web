import { pdf, type DocumentProps } from '@react-pdf/renderer';
import type { ReactElement } from 'react';
import type { Readable } from 'stream';

type MaybeReadablePdfDocument = Readable & {
  end?: () => void;
  readableEnded?: boolean;
  _ended?: boolean;
  _readableState?: {
    ended?: boolean;
  };
};

type ReactPdfInstance = {
  toArrayBuffer?: () => Promise<ArrayBuffer>;
  toBuffer?: () => Promise<unknown>;
  toStream?: () => Promise<unknown>;
};

const isReadable = (value: unknown): value is Readable => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'on' in value &&
    typeof (value as { on?: unknown }).on === 'function' &&
    'pipe' in value &&
    typeof (value as { pipe?: unknown }).pipe === 'function'
  );
};

const toNodeBuffer = (output: unknown): Buffer | null => {
  if (!output) return null;
  if (Buffer.isBuffer(output)) return output;
  if (output instanceof ArrayBuffer) return Buffer.from(output);
  if (ArrayBuffer.isView(output)) return Buffer.from(output as Uint8Array);
  return null;
};

const streamToBuffer = async (stream: Readable): Promise<Buffer> => {
  const chunks: Buffer[] = [];

  await new Promise<void>((resolve, reject) => {
    stream.on('data', (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    stream.on('end', resolve);
    stream.on('error', reject);
  });

  return Buffer.concat(chunks);
};

const maybeEndPdfDocument = (doc: unknown) => {
  if (!isReadable(doc)) return;

  const pdfDoc = doc as MaybeReadablePdfDocument;
  const alreadyEnded =
    pdfDoc.readableEnded === true || pdfDoc._ended === true || pdfDoc._readableState?.ended === true;

  if (!alreadyEnded && typeof pdfDoc.end === 'function') {
    pdfDoc.end();
  }
};

export const bufferFromReactPdf = async (element: ReactElement): Promise<Buffer> => {
  const instance = pdf(element as ReactElement<DocumentProps>) as ReactPdfInstance;

  if (typeof instance.toArrayBuffer === 'function') {
    const arrayBuffer = await instance.toArrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  if (typeof instance.toBuffer === 'function') {
    const output = await instance.toBuffer();
    const nodeBuffer = toNodeBuffer(output);
    if (nodeBuffer) return nodeBuffer;

    if (isReadable(output)) {
      const pendingBuffer = streamToBuffer(output);
      maybeEndPdfDocument(output);
      return await pendingBuffer;
    }
  }

  if (typeof instance.toStream === 'function') {
    const stream = await instance.toStream();
    if (isReadable(stream)) return await streamToBuffer(stream);
  }

  throw new Error('React-PDF could not produce a PDF buffer in this runtime (Node.js required).');
};
