/**
 * In-process event bus. Services emit domain events here; the socket layer
 * (services/socket.js) forwards them to tenant rooms. Repositories never import
 * socket — emit from services/controllers only.
 */
const { EventEmitter } = require('events');

const events = new EventEmitter();
events.setMaxListeners(50);

module.exports = events;
