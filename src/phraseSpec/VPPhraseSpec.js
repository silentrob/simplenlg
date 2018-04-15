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


import PhraseElement from '../framework/phraseElement';
import Element from '../framework/element';
import CoordinatedPhraseElement from '../framework/coordinatedPhraseElement';

import LexicalCategory from '../features/LexicalCategory';

class VPPhraseSpec extends PhraseElement {
  constructor(phraseFactory) {
    super('VERB_PHRASE');
    this.setFactory(phraseFactory);
    
    // set default feature values
    this.setFeature('PERFECT', false);
    this.setFeature('PROGRESSIVE', false);
    this.setFeature('PASSIVE', false);
    this.setFeature('NEGATED', false);
    this.setFeature('TENSE', 'PRESENT');
    this.setFeature('PERSON', 'THIRD');
    this.setPlural(false);
    this.setFeature('FORM', 'NORMAL');
    this.setFeature('REALISE_AUXILIARY', true);
  }

  addModifier(modifier){
    // adverb is preModifier
    // string which is one lexicographic word is looked up in lexicon,
    // if it is an adverb than it becomes a preModifier
    // Everything else is postModifier
    
    if (modifier == null)
      return;
    
    // get modifier as NLGElement if possible
    let modifierElement = null;
    if (modifier instanceof Element)
      modifierElement = modifier;
    else if (typeof modifier == "string"){
      let modifierString = modifier;
      if (modifierString.length > 0 && modifierString.indexOf(" ") === -1)
        modifierElement = this.getFactory().createWord(modifier, LexicalCategory.ANY);
    }
    
    // if no modifier element, must be a complex string
    if (modifierElement == null) {
      this.addPostModifier(modifier);
      return;
    }
    
    // extract WordElement if modifier is a single word
    let modifierWord = null;
    if (modifierElement != null && modifierElement instanceof WordElement){
      modifierWord = modifierElement;
    } else if (modifierElement != null && modifierElement instanceof InflectedWordElement){
      modifierWord = modifierElement.getBaseWord();
    }
    
    if (modifierWord != null && modifierWord.getCategory() == 'ADVERB'){
      this.addPreModifier(modifierWord);
      return;
    }
    
    // default case
    this.addPostModifier(modifierElement);
  }


  getFactory(){
    return this.factory;
  }

  setFactory(phraseFactory){
    this.factory = phraseFactory;
  }

  setVerb(verb){
    let verbElement;
    
    if (typeof verb == "string"){

      if (verb.indexOf(' ') == -1) { // no space, so no particle
        verbElement = this.getFactory().createWord(verb, LexicalCategory.VERB);
      } else { // space, so break up into verb and particle
        let space = verb.indexOf(' ');
        verbElement = this.getFactory().createWord(verb.substring(0, space), LexicalCategory.VERB);
        this.setFeature('PARTICLE', verb.substring(space + 1, verb.length));
      }
    } else { // Object is not a String
      verbElement = this.getFactory().createNLGElement(verb, LexicalCategory.VERB);
    }
    this.setHead(verbElement);
  }

  getVerb(){
    return this.getHead();
  }

  setObject(obj){
    let objectPhrase;
    if (obj instanceof PhraseElement || obj instanceof CoordinatedPhraseElement){
      objectPhrase = obj;
    } else {
      objectPhrase = this.getFactory().createNounPhrase(obj);
    }

    objectPhrase.setFeature('DISCOURSE_FUNCTION', 'OBJECT');
    this.setComplement(objectPhrase);
  }

  getObject(){
    let complements = this.getFeatureAsElementList('COMPLEMENTS');
    for (let i = 0; i < complements.length; i++){
      let complement = complements[i];
      if (complement.getFeature('DISCOURSE_FUNCTION') == 'OBJECT'){
        return complement;
      }
    }
    return null;
  }

  getIndirectObject(){
    let complements = this.getFeatureAsElementList('COMPLEMENTS');
    for (let i = 0; i < complements.length; i++){
      let complement = complements[i];
      if (complement.getFeature('DISCOURSE_FUNCTION') == 'INDIRECT_OBJECT'){
        return complement;
      }
    }
    return null;
  }

  setIndirectObject(indirectObject){
    let indirectObjectPhrase;
    if (indirectObject instanceof PhraseElement || indirectObject instanceof CoordinatedPhraseElement){
      indirectObjectPhrase = indirectObject;
    } else {
      indirectObjectPhrase = this.getFactory().createNounPhrase(indirectObject);
    }

    indirectObjectPhrase.setFeature('DISCOURSE_FUNCTION', 'INDIRECT_OBJECT');
    this.setComplement(indirectObjectPhrase);
  }

}

export default VPPhraseSpec;