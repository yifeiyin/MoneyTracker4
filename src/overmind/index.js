import {
  createStateHook,
  createActionsHook,
  createEffectsHook,
  createReactionHook,
  createConnect,
} from 'overmind-react'
// import { state } from './state'
// import * as actions from './actions'

export const config = {
  onInitialize({ state, actions, effects }, instance) {
    state.rules = effects.storage.getRules();

    instance.reaction(
      ({ rules }) => rules,
      rules => effects.storage.saveRules(rules),
      { nested: true },
    );
  },
  state: {
    isReady: false,
    rules: [],
  },
  actions: {
    load: async ({ state }) => {
      await global.getReady();
      state.isReady = true;
    },
    saveRules: ({ state }, rules) => {
      state.rules = rules;
    }
  },
  effects: {
    storage: {
      getRules() {
        try {
          return JSON.parse(localStorage.getItem('rules') ?? 'let parse throw')
        } catch {
          return []
        }
      },
      saveRules(rules) {
        localStorage.setItem('rules', JSON.stringify(rules))
      },
    }
  }
}

export const useState = createStateHook()
export const useActions = createActionsHook()
export const useEffects = createEffectsHook()
export const useReaction = createReactionHook()
export const connect = createConnect()
