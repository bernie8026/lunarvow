'use strict';
const crypto = require('node:crypto');
const AAD = (config, archiveId, basePath) => `lunarvow-passkey-bridge-v1:${config.build}:${archiveId}:${basePath}`;

function validateAccess(access) {
  if (!access || typeof access.authOrigin !== 'string' ||
      typeof access.archiveId !== 'string' || !/^[A-Za-z0-9_-]{16,128}$/.test(access.archiveId) ||
      typeof access.archiveKeyB64 !== 'string' || !/^[A-Za-z0-9+/]{43}=$/.test(access.archiveKeyB64)) {
    throw new Error('Valid private passkey configuration is required.');
  }
  const origin = new URL(access.authOrigin);
  if (origin.protocol !== 'https:' || origin.origin !== access.authOrigin || !origin.hostname.endsWith('.workers.dev')) {
    throw new Error('Invalid private passkey service origin.');
  }
}

function createBridge(config, key, access, basePath = '/lunarvow/') {
  validateAccess(access);
  if (!Buffer.isBuffer(key) || key.length !== 32) throw new Error('Invalid content key.');
  const wrappingKey = Buffer.from(access.archiveKeyB64, 'base64');
  const iv = crypto.randomBytes(12);
  try {
    const cipher = crypto.createCipheriv('aes-256-gcm', wrappingKey, iv);
    cipher.setAAD(Buffer.from(AAD(config, access.archiveId, basePath)));
    const wrapped = Buffer.concat([cipher.update(key), cipher.final(), cipher.getAuthTag()]);
    return {version: 1, authOrigin: access.authOrigin, archiveId: access.archiveId,
      iv: iv.toString('base64'), wrappedKey: wrapped.toString('base64')};
  } finally { wrappingKey.fill(0); }
}

function unwrapBridge(config, access, basePath = '/lunarvow/') {
  validateAccess(access);
  const bridge = config.passkeys;
  if (bridge?.version !== 1 || bridge.archiveId !== access.archiveId || bridge.authOrigin !== access.authOrigin ||
      typeof bridge.iv !== 'string' || typeof bridge.wrappedKey !== 'string') throw new Error('Passkey envelope does not match the private configuration.');
  const iv = Buffer.from(bridge.iv, 'base64'), wrapped = Buffer.from(bridge.wrappedKey, 'base64');
  if (iv.length !== 12 || wrapped.length !== 48) throw new Error('Invalid passkey envelope.');
  const wrappingKey = Buffer.from(access.archiveKeyB64, 'base64');
  try {
    const decipher = crypto.createDecipheriv('aes-256-gcm', wrappingKey, iv);
    decipher.setAAD(Buffer.from(AAD(config, access.archiveId, basePath)));
    decipher.setAuthTag(wrapped.subarray(-16));
    return Buffer.concat([decipher.update(wrapped.subarray(0, -16)), decipher.final()]);
  } finally { wrappingKey.fill(0); }
}

module.exports = {createBridge, unwrapBridge, validateAccess, AAD};
