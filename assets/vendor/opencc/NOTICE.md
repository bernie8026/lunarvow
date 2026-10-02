# Local Chinese conversion

This browser bundle contains the unmodified conversion engine from
OpenCC-JS 1.0.5 (`nk2028/opencc-js`, commit
`bf16ff16e5ce94cd6bcbe04f05b3fd8ca351bb7c`) under the MIT license.

Its Hong Kong to Simplified Chinese preset includes HKVariantsRev,
HKVariantsRevPhrases, TSCharacters and TSPhrases from opencc-data 1.0.8
(`nk2028/opencc-data`, commit `daf545e2925caf02b1c808cdbb5672d2ce81e474`),
under Apache-2.0. This is the data version locked by OpenCC-JS 1.0.5.
Dictionary text is packed using upstream's build.js rules: first candidate,
skip unchanged single characters, join entries with pipes. ES module export
keywords are removed and the preset is exposed as window.OpenCC.

Only the hk -> cn preset needed by this site is bundled. The original engine
and both licenses accompany the generated file; no CDN is needed at runtime.
