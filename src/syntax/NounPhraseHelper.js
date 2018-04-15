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


import ListElement from '../framework/listElement';
import PhraseHelper from './PhraseHelper';
import WordElement from '../framework/wordElement';
import InflectedWordElement from '../framework/inflectedWordElement';

import Feature from '../features/Feature';
import Person from '../features/Person';
import Gender from '../features/Gender';
import LexicalFeature from '../features/LexicalFeature';
import InternalFeature from '../features/InternalFeature';
import LexicalCategory from '../features/LexicalCategory';
import DiscourseFunction from '../features/DiscourseFunction';

import PhraseCategory from '../features/PhraseCategory';

class NounPhraseHelper {
  static realise(parent, phrase){
    let realisedElement = null;

    if (phrase != null && !phrase.getFeatureAsBoolean(Feature.ELIDED)) {
      realisedElement = new ListElement();

      if (phrase.getFeatureAsBoolean(Feature.PRONOMINAL)){
        let newPronounComponent = NounPhraseHelper.createPronoun(parent, phrase);
        realisedElement.addComponent(newPronounComponent);
      } else {
        realisedElement = NounPhraseHelper.realiseSpecifier(phrase, parent, realisedElement);
        realisedElement = NounPhraseHelper.realisePreModifiers(phrase, parent, realisedElement);
        realisedElement = NounPhraseHelper.realiseHeadNoun(phrase, parent, realisedElement);

        realisedElement = PhraseHelper.realiseList(parent, realisedElement, phrase.getFeatureAsElementList(InternalFeature.COMPLEMENTS), DiscourseFunction.COMPLEMENT);
        realisedElement = PhraseHelper.realiseList(parent, realisedElement, phrase.getPostModifiers(), DiscourseFunction.POST_MODIFIER);
      }
    }

    return realisedElement;
  }

  static createPronoun(parent, phrase){

    let pronoun = "it";
    let phraseFactory = phrase.getFactory();
    let personValue = phrase.getFeature(Feature.PERSON);

    if (Person.FIRST == personValue){
      pronoun = "I";
    } else if (Person.SECOND == personValue){
      pronoun = "you";
    } else {
      let genderValue = phrase.getFeature(LexicalFeature.GENDER);
      if (Gender.FEMININE == genderValue){
        pronoun = "she";
      } else if (Gender.MASCULINE == genderValue){
        pronoun = "he";
      }
    }

    // AG: createWord now returns WordElement; so we embed it in an
    // inflected word element here
    let element;
    let proElement = phraseFactory.createWord(pronoun, LexicalCategory.PRONOUN);
    if (proElement instanceof WordElement){
      element = new InflectedWordElement(proElement);
      element.setFeature(LexicalFeature.GENDER, proElement.getFeature(LexicalFeature.GENDER));  
      element.setFeature(Feature.PERSON, proElement.getFeature(Feature.PERSON));  
    } else {
      element = proElement;
    }
    
    element.setFeature(InternalFeature.DISCOURSE_FUNCTION, DiscourseFunction.SPECIFIER);
    element.setFeature(Feature.POSSESSIVE, phrase.getFeature(Feature.POSSESSIVE));
    element.setFeature(Feature.NUMBER, phrase.getFeature(Feature.NUMBER));

    if (phrase.hasFeature(InternalFeature.DISCOURSE_FUNCTION)) {
      element.setFeature(InternalFeature.DISCOURSE_FUNCTION, phrase.getFeature(InternalFeature.DISCOURSE_FUNCTION));
    }

    return element;
  }

  static realiseSpecifier(phrase, parent, realisedElement){
    let specifierElement = phrase.getFeatureAsElement(InternalFeature.SPECIFIER);

    if (specifierElement != null && !phrase.getFeatureAsBoolean(InternalFeature.RAISED) && !phrase.getFeatureAsBoolean(Feature.ELIDED)) {
      if (!specifierElement.isA(LexicalCategory.PRONOUN) && specifierElement.getCategory() != PhraseCategory.NOUN_PHRASE) {
        specifierElement.setFeature(Feature.NUMBER, phrase.getFeature(Feature.NUMBER));
      }
      
      let currentElement = parent.realise(specifierElement);
      
      if (currentElement != null){
        currentElement.setFeature(InternalFeature.DISCOURSE_FUNCTION, DiscourseFunction.SPECIFIER);
        realisedElement.addComponent(currentElement);
      }
    }
    return realisedElement;
  }

  static realisePreModifiers(phrase, parent, realisedElement){
    let preModifiers = phrase.getPreModifiers();
    if (phrase.getFeatureAsBoolean('ADJECTIVE_ORDERING')){
      preModifiers = this.sortNPPreModifiers(preModifiers);
    }
    return PhraseHelper.realiseList(parent, realisedElement, preModifiers, 'PRE_MODIFIER');
  }

  static realiseHeadNoun(phrase, parent, realisedElement){

    let headElement = phrase.getHead();

    if (headElement != null) {

      headElement.setFeature(Feature.ELIDED, phrase.getFeature(Feature.ELIDED));
      headElement.setFeature(LexicalFeature.GENDER, phrase.getFeature(LexicalFeature.GENDER));
      headElement.setFeature(InternalFeature.ACRONYM, phrase.getFeature(InternalFeature.ACRONYM));
      headElement.setFeature(Feature.NUMBER, phrase.getFeature(Feature.NUMBER));
      headElement.setFeature(Feature.PERSON, phrase.getFeature(Feature.PERSON));
      headElement.setFeature(Feature.POSSESSIVE, phrase.getFeature(Feature.POSSESSIVE));
      headElement.setFeature(Feature.PASSIVE, phrase.getFeature(Feature.PASSIVE));
      let currentElement = parent.realise(headElement);

      currentElement.setFeature(InternalFeature.DISCOURSE_FUNCTION, DiscourseFunction.SUBJECT);
      realisedElement.addComponent(currentElement);
    }
    return realisedElement;
  }

  static sortNPPreModifiers(originalModifiers){

    let orderedModifiers = null;
    

    if (originalModifiers == null || originalModifiers.length <= 1) {
      orderedModifiers = originalModifiers;
    } else {
      console.log("sortNPPreModifiers NOT DONE");
      orderedModifiers = originalModifiers;
      let changesMade = false;
      // do {
      //   changesMade = false;
      //   for (int i = 0; i < orderedModifiers.size() - 1; i++) {
      //     if (getMinPos(orderedModifiers.get(i)) > getMaxPos(orderedModifiers.get(i + 1))) {
      //       let temp = orderedModifiers.get(i);
      //       orderedModifiers.set(i, orderedModifiers.get(i + 1));
      //       orderedModifiers.set(i + 1, temp);
      //       changesMade = true;
      //     }
      //   }
      // } while (changesMade == true);
    }
    return orderedModifiers;
  }
}

export default NounPhraseHelper;
