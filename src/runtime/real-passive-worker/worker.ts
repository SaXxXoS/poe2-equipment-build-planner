/// <reference lib="webworker" />
import officialTree from '../../../generated/poe2-tree/tree.json'
import type { ClientToWorkerMessage } from './contracts'
import { createRealPassiveWorkerDispatcher } from './dispatcher'

const scope=self as unknown as DedicatedWorkerGlobalScope
const dispatcher=createRealPassiveWorkerDispatcher({tree:officialTree},message=>scope.postMessage(message))
scope.addEventListener('message',event=>void dispatcher.dispatch(event.data as ClientToWorkerMessage))
