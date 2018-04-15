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
import CoordinatedPhraseElement from '../framework/coordinatedPhraseElement';
import WordElement from '../framework/wordElement';
import InflectedWordElement from '../framework/inflectedWordElement';
import VPPhraseSpec from './VPPhraseSpec';
import AdvPhraseSpec from './AdvPhraseSpec';

import LexicalCategory from '../features/LexicalCategory'
import InternalFeature from '../features/InternalFeature';
import LexicalFeature from '../features/LexicalFeature';
import Feature from '../features/Feature';

import Element from '../framework/element';

const vpFeatures = ['MODAL', 'TENSE', 'NEGATED', 'NUMBER', 'PASSIVE','PERFECT', 'PARTICLE', 'PERSON','PROGRESSIVE', 'REALISE_AUXILIARY', 'FORM', 'INTERROGATIVE_TYPE'];

class SPhraseSpec extends PhraseElement {

  constructor(phraseFactory) {
    super('CLAUSE');
    this.factory = phraseFactory;

    this.setVerbPhrase(phraseFactory.createVerbPhrase());

    this.setFeature(Feature.ELIDED, false);
    this.setFeature(InternalFeature.CLAUSE_STATUS, 'MATRIX');
    this.setFeature(Feature.SUPRESSED_COMPLEMENTISER, false);
    this.setFeature(LexicalFeature.EXPLETIVE_SUBJECT, false);
    this.setFeature(Feature.COMPLEMENTISER, phraseFactory.createWord('that', LexicalCategory.COMPLEMENTISER));

  }

  addComplement(complement){
    let verbPhrase = this.getFeatureAsElement(InternalFeature.VERB_PHRASE);
    if (verbPhrase != null || verbPhrase instanceof VPPhraseSpec){
      verbPhrase.addComplement(complement);
    } else {
      super.addComplement(complement);
    }
  }

  addModifier(modifier){
    // adverb is frontModifier if sentenceModifier
    // otherwise adverb is preModifier
    // string which is one lexicographic word is looked up in lexicon,
    // above rules apply if adverb
    // Everything else is postModifier

    if (modifier == null)
      return;

    // get modifier as NLGElement if possible
    let modifierElement = null;
    if (modifier instanceof Element){
      modifierElement = modifier;
    } else if (typeof modifier == "string"){
      let modifierString =  modifier;

      if (modifierString.length > 0 && modifierString.indexOf(" ") == -1){
        modifierElement = this.getFactory().createWord(modifier, LexicalCategory.ANY);
      }
    }

    // if no modifier element, must be a complex string
    if (modifierElement == null) {
      this.addPostModifier(modifier);
      return;
    }

    // AdvP is premodifer (probably should look at head to see if sentenceModifier)
    if (modifierElement instanceof AdvPhraseSpec) {
      this.addPreModifier(modifierElement);
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
      // adverb rules
      if (modifierWord.getFeatureAsBoolean('SENTENCE_MODIFIER')){
        this.addFrontModifier(modifierWord);
      } else {
        this.addPreModifier(modifierWord);
      }
      return;
    }

    // default case
    this.addPostModifier(modifierElement);

  }

  addPreModifier(newPreModifier){
    let verbPhrase = this.getFeatureAsElement('VERB_PHRASE');

    if (verbPhrase != null) {
      if (verbPhrase instanceof PhraseElement) {
        verbPhrase.addPreModifier(newPreModifier);
      } else if (verbPhrase instanceof CoordinatedPhraseElement) {
        verbPhrase.addPreModifier(newPreModifier);
      } else {
        super.addPreModifier(newPreModifier);
      }
    }
  }

  getFactory(){
    return this.factory;
  }

  getFeature(featureName) {
    if (super.getFeature(featureName) != null)
      return super.getFeature(featureName);

    if (vpFeatures.indexOf(featureName) != -1){
      let verbPhrase = this.getFeatureAsElement(InternalFeature.VERB_PHRASE);
      if (verbPhrase != null || verbPhrase instanceof VPPhraseSpec)
        return verbPhrase.getFeature(featureName);
    }
    return null;
  }

  getObject(){
    let verbPhrase = this.getFeatureAsElement('VERB_PHRASE');

    if (verbPhrase != null || verbPhrase instanceof VPPhraseSpec){
      return verbPhrase.getObject();
    } else{
      return null;
    }
  }

  getSubject(){
    let subjects = this.getFeatureAsElementList('SUBJECTS');
    if (subjects == null || subjects.length === 0){
      return null;
    }
    return subjects[0];
  }

  getVerb() {
    let verbPhrase = this.getFeatureAsElement('VERB_PHRASE');
    if (verbPhrase != null || verbPhrase instanceof VPPhraseSpec){
      return verbPhrase.getHead();
    } else {
      // return null if VP is coordinated phrase
      return null;
    }
  }

  getVerbPhrase(){
    return this.getFeatureAsElement('VERB_PHRASE');
  }

  getIndirectObject(){
    let verbPhrase = this.getFeatureAsElement('VERB_PHRASE');
    if (verbPhrase != null || verbPhrase instanceof VPPhraseSpec){
      return verbPhrase.getIndirectObject();
    } else {
      return null;
    }
  }


  setVerbPhrase(vp) {
    this.setFeature('VERB_PHRASE', vp);
    vp.setParent(this);
  }

  setFeature(featureName, featureValue){
    super.setFeature(featureName, featureValue);
    
    if (vpFeatures.indexOf(featureName.toUpperCase()) != -1){
      let verbPhrase = this.getFeatureAsElement(InternalFeature.VERB_PHRASE);
      if (verbPhrase != null || verbPhrase instanceof VPPhraseSpec)
        verbPhrase.setFeature(featureName, featureValue);
    }
  }

  setVerb(verb){
    // get verb phrase element (create if necessary)
    let verbPhraseElement = this.getVerbPhrase();

    // set head of VP to verb (if this is VPPhraseSpec, and not a coord)
    if (verbPhraseElement != null && verbPhraseElement instanceof VPPhraseSpec){
      verbPhraseElement.setVerb(verb);
    }
   }

  setSubject(subject){
    let subjectPhrase;
    if (subject instanceof PhraseElement || subject instanceof CoordinatedPhraseElement){
      subjectPhrase = subject;
    } else {
      subjectPhrase = this.getFactory().createNounPhrase(subject);
    }

    this.setFeature('SUBJECTS', [subjectPhrase]);
  }

  setObject(obj){
    // get verb phrase element (create if necessary)
    let verbPhraseElement = this.getVerbPhrase();

    // set object of VP to verb (if this is VPPhraseSpec, and not a coord)
    if (verbPhraseElement != null && verbPhraseElement instanceof VPPhraseSpec){
      verbPhraseElement.setObject(obj);
    }
  }

  setIndirectObject(indirectObject){
    // get verb phrase element (create if necessary)
    let verbPhraseElement = this.getVerbPhrase();

    // set head of VP to verb (if this is VPPhraseSpec, and not a coord)
    if (verbPhraseElement != null && verbPhraseElement instanceof VPPhraseSpec){
      verbPhraseElement.setIndirectObject(indirectObject);
    }
  }

}

export default SPhraseSpec;
