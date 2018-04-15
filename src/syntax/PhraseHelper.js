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
import DiscourseFunction from '../features/DiscourseFunction';
import Feature from '../features/Feature';
import InternalFeature from '../features/InternalFeature';
import LexicalCategory from '../features/LexicalCategory';
import InflectedWordElement from '../framework/InflectedWordElement';

class PhraseHelper {

  static realiseList(parent, realisedElement, elementList, func){

    let realisedList = new ListElement();
    let currentElement = null;

    for (let i = 0; i < elementList.length; i++){
      let eachElement = elementList[i];
      currentElement = parent.realise(eachElement);
      if (currentElement != null) {
        currentElement.setFeature('DISCOURSE_FUNCTION', func);

        if (eachElement.getFeatureAsBoolean('APPOSITIVE')){
          currentElement.setFeature('APPOSITIVE', true);
        }

        realisedList.addComponent(currentElement);
      }
    }

    if (realisedList.getChildren().length !== 0){
      realisedElement.addComponent(realisedList);
    }
    return realisedElement;
  }

  static isExpletiveSubject(phrase){
    let subjects = phrase.getFeatureAsElementList('SUBJECTS');
    let expletive = false;

    if (subjects.length == 1) {
      let subjectNP = subjects[0];

      if (subjectNP.isA('NOUN_PHRASE')) {
        expletive = subjectNP.getFeatureAsBoolean('EXPLETIVE_SUBJECT');
      } else if (subjectNP.isA('CANNED_TEXT')) {
        expletive = "there" == subjectNP.getRealisation();
      }
    }
    return expletive;
  }

  static realise(parent, phrase){
    let realisedElement = null;

    if (phrase != null) {
      realisedElement = new ListElement();

      realisedElement = this.realiseList(parent, realisedElement, phrase.getPreModifiers(), DiscourseFunction.PRE_MODIFIER);

      realisedElement = PhraseHelper.realiseHead(parent, phrase, realisedElement);
      realisedElement = PhraseHelper.realiseComplements(parent, phrase, realisedElement);

      realisedElement = PhraseHelper.realiseList(parent, realisedElement, phrase.getPostModifiers(), DiscourseFunction.POST_MODIFIER);
    }
    
    return realisedElement;
  }


  static realiseHead(parent, phrase, realisedElement){

    let head = phrase.getHead();
    if (head != null) {
      if (phrase.hasFeature(Feature.IS_COMPARATIVE)) {
        head.setFeature(Feature.IS_COMPARATIVE, phrase.getFeature(Feature.IS_COMPARATIVE));
      } else if (phrase.hasFeature(Feature.IS_SUPERLATIVE)) {
        head.setFeature(Feature.IS_SUPERLATIVE, phrase.getFeature(Feature.IS_SUPERLATIVE));
      }
      head = parent.realise(head);
      head.setFeature(InternalFeature.DISCOURSE_FUNCTION, DiscourseFunction.HEAD);
      realisedElement.addComponent(head);
    }
    return realisedElement;
  }

  static realiseComplements(parent, phrase, realisedElement){

    let firstProcessed = false;
    let currentElement = null;

    let complements = phrase.getFeatureAsElementList(InternalFeature.COMPLEMENTS);
    for (let i = 0; i < complements.length; i++){
      let complement = complements[i];
      currentElement = parent.realise(complement);
      if (currentElement != null) {
        currentElement.setFeature(InternalFeature.DISCOURSE_FUNCTION, DiscourseFunction.COMPLEMENT);
        if (firstProcessed) {
          realisedElement.addComponent(new InflectedWordElement("and", LexicalCategory.CONJUNCTION));
        } else {
          firstProcessed = true;
        }
        realisedElement.addComponent(currentElement);
      }
    }

    return realisedElement;
  }

}

export default PhraseHelper;
