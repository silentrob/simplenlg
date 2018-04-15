/*
 * The contents of this file are subject to the Mozilla Public License
 * Version 1.1 (the "License"); you may not use this file except in
 * compliance with the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied. See the
 * License for the specific language governing rights and limitations
 * under the License.
 *
 * The Original Code is "Simplenlg".
 *
 * The Initial Developer of the Original Code is Ehud Reiter, Albert Gatt and Dave Westwater.
 * Portions created by Ehud Reiter, Albert Gatt and Dave Westwater are Copyright (C) 2010-11 The University of Aberdeen. All Rights Reserved.
 *
 * Contributor(s): Ehud Reiter, Albert Gatt, Dave Wewstwater, Roman Kutlak, Margaret Mitchell.
 */


import NPPhraseSpec from '../phraseSpec/NPPhraseSpec';
import SPhraseSpec from '../phraseSpec/SPhraseSpec';
import VPPhraseSpec from '../phraseSpec/VPPhraseSpec';
import PPPhraseSpec from '../phraseSpec/PPPhraseSpec';
import AdvPhraseSpec from '../phraseSpec/AdvPhraseSpec';
import AdjPhraseSpec from '../phraseSpec/AdjPhraseSpec';

import Element from './element';
import WordElement from './wordElement';
import StringElement from './stringElement';
import InflectedWordElement from './inflectedWordElement';
import PhraseElement from './phraseElement';
import CoordinatedPhraseElement from './coordinatedPhraseElement';
import DocumentElement from './documentElement';

import Feature from '../features/Feature';
import Person from '../features/Person';
import Gender from '../features/Gender';
import LexicalFeature from '../features/LexicalFeature';
import InternalFeature from '../features/InternalFeature';
import DiscourseFunction from '../features/DiscourseFunction';
import NumberAgreement from '../features/NumberAgreement';

import LexicalCategory from '../features/LexicalCategory';
import DocumentCategory from '../features/DocumentCategory';


const PRONOUNS = ["I","you","he","she","it","me","you","him","her","it","myself","yourself","himself","herself","itself","mine","yours","his","hers","its","we","you","they","they","they","us","you","them","them","them","ourselves","yourselves","themselves","themselves","themselves","ours","yours","theirs","theirs","theirs","there"];
const FIRST_PRONOUNS = ["I","me","myself","we","us","ourselves","mine","my","ours","our"];

const SECOND_PRONOUNS = ["you","yourself","yourselves","yours","your"];

/** The list of reflexive English pronouns. */
const REFLEXIVE_PRONOUNS = ["myself","yourself","himself","herself","itself","ourselves","yourselves","themselves"];

/** The list of masculine English pronouns. */
const MASCULINE_PRONOUNS = ["he", "him", "himself", "his"];

/** The list of feminine English pronouns. */
const FEMININE_PRONOUNS = ["she", "her", "herself", "hers"];

/** The list of possessive English pronouns. */
const POSSESSIVE_PRONOUNS = ["mine","ours","yours","his","hers","its","theirs","my","our","your","her","their"];

/** The list of plural English pronouns. */
const PLURAL_PRONOUNS = ["we","us","ourselves","ours","our","they","them","theirs","their"];

/** The list of English pronouns that can be singular or plural. */
const EITHER_NUMBER_PRONOUNS = ["there"];

/** The list of expletive English pronouns. */
const EXPLETIVE_PRONOUNS = ["there"];


class NLG {
  constructor(newLexicon){
    this.lexicon = newLexicon;
  }

  createNounPhrase(specifier = null, noun = null){
    if (arguments.length == 1){
      noun = specifier
      specifier = null;
    }

    if(noun instanceof NPPhraseSpec){
      return noun;
    }
    
    let phraseElement = new NPPhraseSpec(this);

    // SPhrase or other type?
    let nounElement = this.createNLGElement(noun, LexicalCategory.NOUN);
    this.setPhraseHead(phraseElement, nounElement);

    if (specifier != null){
      phraseElement.setSpecifier(specifier);
    }

    return phraseElement;
  }

  createVerbPhrase(verb = null){
    let phraseElement = new VPPhraseSpec(this);
    phraseElement.setVerb(verb);
    this.setPhraseHead(phraseElement, phraseElement.getVerb());
    return phraseElement;
  }

  setPhraseHead(phraseElement, headElement){
    if(headElement != null) {
      phraseElement.setHead(headElement);
      headElement.setParent(phraseElement);
    }
  }

  createSentence(){
    const args = Array.from(arguments);
    if (args.length === 0){
      return new DocumentElement(DocumentCategory.SENTENCE, null);  
    } else if (args.length === 1){
      let sentence = new DocumentElement(DocumentCategory.SENTENCE, null);
      if (typeof args[0] === "string"){
        sentence.addComponent(this.createStringElement(args[0]));
      } else {
        if (typeof args[0] === "array"){
          sentence.addComponents(args[0]);  
        } else {
          sentence.addComponent(args[0]);
        }
      }      
      return sentence;
    } else if (args.length <= 2){
      let sentence = new DocumentElement(DocumentCategory.SENTENCE, null);
      sentence.addComponent(createClause(args[0], args[1], args[2]));
      return sentence;
    }
  }

  createCoordinatedPhrase(coord1, coord2){
    const args = Array.from(arguments);
    if (args.length === 2){
      return new CoordinatedPhraseElement(coord1, coord2);  
    } else {
      return new CoordinatedPhraseElement();
    }
  }

  createNLGElement(element, category){

    if (element === null){
      return null;
    } else if (element instanceof InflectedWordElement){
      return element.getBaseWord();
    } else if (element instanceof StringElement){
      if(this.stringIsWord(element.getRealisation(), category)){
        return this.createWord(element.getRealisation(), category);
      } else {
        return element;
      }
    } else if (element instanceof Element){
      return element;
    } else if (typeof element === "string"){
      if(this.stringIsWord(element, category)){
        return this.createWord(element, category);
      } else {
        return new StringElement(element);
      }
    }

    throw new Error(element.toString() + " is not a valid type");
  }

  createAdjectivePhrase(adjective) {
    let phraseElement = new AdjPhraseSpec(this);

    let adjectiveElement = this.createNLGElement(adjective, LexicalCategory.ADJECTIVE);
    this.setPhraseHead(phraseElement, adjectiveElement);

    return phraseElement;
  }

  createInflectedWord(word, category){
    // first get the word element
    let inflElement = null;
    
    if(word instanceof WordElement) {
      inflElement = new InflectedWordElement(word);
    } else if(typeof word == "string"){
      let baseword = this.createWord(word, category);
      if(baseword != null && baseword instanceof WordElement) {
        inflElement = new InflectedWordElement(baseword);
      } else {
        inflElement = new InflectedWordElement(word, category);
      }

    } else if(word instanceof Element) {
      inflElement = word;
    }

    return inflElement;
  }

  stringIsWord(string, category){
    return this.lexicon != null && 
      (this.lexicon.hasWord(string, category) || PRONOUNS.indexOf(string) != -1 || string.indexOf(" ") == -1);
  }
  
  createClause(subject = null, verb = null, directObject = null){
    
    let phraseElement = new SPhraseSpec(this);

    if(verb != null) {
      if(verb instanceof PhraseElement) {
        phraseElement.setVerbPhrase(verb);
      } else {
        phraseElement.setVerb(verb);
      }
    }

    if(subject != null){
      phraseElement.setSubject(subject);
    }

    if(directObject != null) {
      phraseElement.setObject(directObject);
    }

    return phraseElement;
  }

  createWord(word, category){
    let wordElement = null;
    if(word instanceof Element) {
      wordElement = word;
      
    } else if(!(word instanceof LexicalCategory) && this.lexicon != null){
      wordElement = this.lexicon.lookupWord(word, category);
      if(PRONOUNS.indexOf(word) != -1){
        this.setPronounFeatures(wordElement, word);
      }
    }
    return wordElement;
  }

  setPronounFeatures(wordElement, word){
    wordElement.setCategory(LexicalCategory.PRONOUN);
    if(FIRST_PRONOUNS.indexOf(word) != -1) {
      wordElement.setFeature(Feature.PERSON, Person.FIRST);
    } else if(SECOND_PRONOUNS.indexOf(word) != -1) {
      wordElement.setFeature(Feature.PERSON, Person.SECOND);

      if("yourself" == word){
        wordElement.setPlural(false);
      } else if("yourselves" == word){
        wordElement.setPlural(true);
      } else {
        wordElement.setFeature(Feature.NUMBER, NumberAgreement.BOTH);
      }
    } else {
      wordElement.setFeature(Feature.PERSON, Person.THIRD);
    }

    if(REFLEXIVE_PRONOUNS.indexOf(word) != -1) {
      wordElement.setFeature(LexicalFeature.REFLEXIVE, true);
    } else {
      wordElement.setFeature(LexicalFeature.REFLEXIVE, false);
    }

    if(MASCULINE_PRONOUNS.indexOf(word) != -1) {
      wordElement.setFeature(LexicalFeature.GENDER, Gender.MASCULINE);
    } else if(FEMININE_PRONOUNS.indexOf(word) != -1) {
      wordElement.setFeature(LexicalFeature.GENDER, Gender.FEMININE);
    } else {
      wordElement.setFeature(LexicalFeature.GENDER, Gender.NEUTER);
    }

    if(POSSESSIVE_PRONOUNS.indexOf(word) != -1) {
      wordElement.setFeature(Feature.POSSESSIVE, true);
    } else {
      wordElement.setFeature(Feature.POSSESSIVE, false);
    }

    if(PLURAL_PRONOUNS.indexOf(word) != -1 && SECOND_PRONOUNS.indexOf(word) <= 0){
      wordElement.setPlural(true);
    } else if(EITHER_NUMBER_PRONOUNS.indexOf(word) <= 0){
      wordElement.setPlural(false);
    }

    if(EXPLETIVE_PRONOUNS.indexOf(word) != -1) {
      wordElement.setFeature(InternalFeature.NON_MORPH, true);
      wordElement.setFeature(LexicalFeature.EXPLETIVE_SUBJECT, true);
    }
    return wordElement;
  }

  createAdverbPhrase(adverb){
    let phraseElement = new AdvPhraseSpec(this);
    let adverbElement = this.createNLGElement(adverb, LexicalCategory.ADVERB);
    this.setPhraseHead(phraseElement, adverbElement);
    return phraseElement;

  }

  createPrepositionPhrase(preposition = null, complement = null){
    let phraseElement = new PPPhraseSpec(this);

    let prepositionalElement = this.createNLGElement(preposition, 'PREPOSITION');
    this.setPhraseHead(phraseElement, prepositionalElement);

    if(complement != null) {
      this.setComplement(phraseElement, complement);
    }
    return phraseElement;
  }

  setComplement(phraseElement, complement){
    let complementElement = this.createNLGElement(complement);
    phraseElement.addComplement(complementElement);
  }

  createStringElement(text = null){
    return new StringElement(text);
  }
}

export default NLG;
