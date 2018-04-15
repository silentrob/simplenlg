# SimpleNLG in Javascript

* CAUTION: This project is very much WIP* 

This is functional port of [SimpleNLG](https://github.com/simplenlg/simplenlg), most the tests, methods classes and interfaces have been ported.

Notably missing from this port.

- Adjective ordering is still not complete. [TODO]
- Aggergating interface is missing. [TODO]
- Some more complex document types are not yet supported. [TODO]
- We have a few missing or failing tests. [TODO]
- NIHLexicon. I hard coded the XML Adapter to simplify the lexicon.
- The Server Interface -- This seemed out of context and with Node you could easily add something directly.

## Setup 

Download or clone the repo.

Install the dependancies

`npm install`

## Example

```
import Lexicon from '../src/lexicon/lexicon';
import Realiser from '../src/realiser/Realiser';
import NLG from '../src/framework/nlg';

const lexicon = new Lexicon('lexicon.xml');
const nlg = new NLG(lexicon);
const realiser = new Realiser(lexicon);

// Create a new canned sentense.
let s1 = nlg.createSentence("my dog is happy");

// And realize that sentence like this:
console.log(realiser.realiseSentence(s1)); // My dog is happy.
```

## Whats next.

Jump into the tests, or take a look at the [simpleNLG Wiki](https://github.com/simplenlg/simplenlg/wiki) for more information.

What to help out. Pull requests welcome.

## License

SimpleNLG is licensed under the terms and conditions of Mozilla Public License 1.1.
