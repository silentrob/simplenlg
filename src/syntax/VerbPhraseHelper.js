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


import Element from '../framework/element';
import ListElement from '../framework/listElement';
import PhraseElement from '../framework/phraseElement';
import WordElement from '../framework/wordElement';
import StringElement from '../framework/stringElement';

import PhraseHelper from './PhraseHelper';

import SPhraseSpec from '../phraseSpec/SPhraseSpec';

import InflectedWordElement from '../framework/inflectedWordElement';
import CoordinatedPhraseElement from '../framework/coordinatedPhraseElement';

import Feature from '../features/Feature';
import Form from '../features/Form';
import Tense from '../features/Tense';
import LexicalCategory from '../features/LexicalCategory';
import InterrogativeType from '../features/interrogativeType';
import PhraseCategory from '../features/PhraseCategory';
import NumberAgreement from '../features/NumberAgreement';
import InternalFeature from '../features/InternalFeature';


class VerbPhraseHelper {

  static realise(parent, phrase) {
    let realisedElement = null;
    let vgComponents = null;
    let mainVerbRealisation = [];
    let auxiliaryRealisation = [];

    if (phrase != null) {

      vgComponents = VerbPhraseHelper.createVerbGroup(parent, phrase);
      [mainVerbRealisation, auxiliaryRealisation] = VerbPhraseHelper.splitVerbGroup(vgComponents, mainVerbRealisation, auxiliaryRealisation);


      realisedElement = new ListElement();

      if (!phrase.hasFeature('REALISE_AUXILIARY') || phrase.getFeatureAsBoolean('REALISE_AUXILIARY')){
        realisedElement = VerbPhraseHelper.realiseAuxiliaries(parent, realisedElement, auxiliaryRealisation);
        realisedElement = PhraseHelper.realiseList(parent, realisedElement, phrase.getPreModifiers(), 'PRE_MODIFIER');
        realisedElement = VerbPhraseHelper.realiseMainVerb(parent, phrase, mainVerbRealisation, realisedElement);

      } else if (VerbPhraseHelper.isCopular(phrase.getHead())){
        realisedElement = VerbPhraseHelper.realiseMainVerb(parent, phrase, mainVerbRealisation, realisedElement);
        realisedElement = PhraseHelper.realiseList(parent, realisedElement, phrase.getPreModifiers(), 'PRE_MODIFIER');
      } else {
        realisedElement = PhraseHelper.realiseList(parent, realisedElement, phrase.getPreModifiers(), 'PRE_MODIFIER');
        realisedElement = VerbPhraseHelper.realiseMainVerb(parent, phrase, mainVerbRealisation, realisedElement);
      }
      realisedElement = VerbPhraseHelper.realiseComplements(parent, phrase, realisedElement);
      realisedElement = PhraseHelper.realiseList(parent, realisedElement, phrase.getPostModifiers(), 'POST_MODIFIER');
    }

    return realisedElement;
  }

  static realiseAuxiliaries(parent, realisedElement, auxiliaryRealisation) {
    let aux = null;
    let currentElement = null;
    while (!auxiliaryRealisation.length == 0) {
      aux = auxiliaryRealisation.pop();
      currentElement = parent.realise(aux);
      if (currentElement != null) {
        realisedElement.addComponent(currentElement);
        currentElement.setFeature('DISCOURSE_FUNCTION','AUXILIARY');
      }
    }
    return realisedElement;
  }

  static realiseComplements(parent, phrase, realisedElement){

    let indirects = new ListElement();
    let directs = new ListElement();
    let unknowns = new ListElement();
    let discourseValue = null;
    let currentElement = null;

    // THIS SHOULD BE 2
    let complements = phrase.getFeatureAsElementList('COMPLEMENTS');

    for (let i = 0; i < complements.length; i++){
      let complement = complements[i];

      discourseValue = complement.getFeature('DISCOURSE_FUNCTION');
      currentElement = parent.realise(complement);

      if (currentElement != null) {
        currentElement.setFeature('DISCOURSE_FUNCTION', 'COMPLEMENT');

        if ('INDIRECT_OBJECT' == discourseValue) {
          indirects.addComponent(currentElement);
        } else if ('OBJECT' == discourseValue) {
          directs.addComponent(currentElement);
        } else {
          unknowns.addComponent(currentElement);
        }
      }
    }

    if (!InterrogativeType.isIndirectObject(phrase.getFeature(Feature.INTERROGATIVE_TYPE))){
      realisedElement.addComponents(indirects.getChildren());
    }
    if (!phrase.getFeatureAsBoolean(Feature.PASSIVE)){
      if (!InterrogativeType.isObject(phrase.getFeature(Feature.INTERROGATIVE_TYPE))){
        realisedElement.addComponents(directs.getChildren());
      }
      realisedElement.addComponents(unknowns.getChildren());
    }

    return realisedElement;
  }

  static createVerbGroup(parent, phrase){

    let actualModal = null;
    let formValue = phrase.getFeature('FORM');
    let tenseValue = phrase.getFeature('TENSE');
    let modal = phrase.getFeatureAsString('MODAL');
    let modalPast = false;
    let vgComponents = [];
    let interrogative = phrase.hasFeature('INTERROGATIVE_TYPE');

    if (formValue == 'GERUND' || formValue == 'INFINITIVE'){
      tenseValue = Tense.PRESENT;
    }

    if (formValue == 'INFINITIVE'){
      actualModal = "to";
    } else if (formValue == null || 'NORMAL' == formValue){

      if (Tense.FUTURE.equals(tenseValue) && modal == null
          && ((!(phrase.getHead() instanceof CoordinatedPhraseElement)) 
            || (phrase.getHead() instanceof CoordinatedPhraseElement && interrogative))) {

        actualModal = "will";

      } else if (modal != null) {
        actualModal = modal;
        if (Tense.PAST.equals(tenseValue)){
          modalPast = true;
        }
      }
    }

    vgComponents = VerbPhraseHelper.pushParticles(phrase, parent, vgComponents);
    let frontVG = VerbPhraseHelper.grabHeadVerb(phrase, tenseValue, modal != null);

    VerbPhraseHelper.checkImperativeInfinitive(formValue, frontVG);

    if (phrase.getFeatureAsBoolean('PASSIVE')){
      frontVG = VerbPhraseHelper.addBe(frontVG, vgComponents, 'PAST_PARTICIPLE');
    }

    if (phrase.getFeatureAsBoolean('PROGRESSIVE')){
      frontVG = VerbPhraseHelper.addBe(frontVG, vgComponents, 'PRESENT_PARTICIPLE');
    }

    if (phrase.getFeatureAsBoolean('PERFECT') || modalPast) {
      frontVG = VerbPhraseHelper.addHave(frontVG, vgComponents, modal, tenseValue);
    }

    frontVG = VerbPhraseHelper.pushIfModal(actualModal != null, phrase, frontVG, vgComponents);
    frontVG = VerbPhraseHelper.createNot(phrase, vgComponents, frontVG, modal != null);

    if (frontVG != null) {
      vgComponents = VerbPhraseHelper.pushFrontVerb(phrase, vgComponents, frontVG, formValue, interrogative);
    }

    vgComponents = VerbPhraseHelper.pushModal(actualModal, phrase, vgComponents);
    return vgComponents;
  }


  /**
   * Adds <em>have</em> to the stack.
   * 
   * @param frontVG
   *            the first verb in the verb group.
   * @param vgComponents
   *            the stack of verb components in the verb group.
   * @param modal
   *            the modal to be used.
   * @param tenseValue
   *            the <code>Tense</code> of the phrase.
   * @return the new element for the front of the group.
   */
  static addHave(frontVG, vgComponents, modal, tenseValue) {
    let newFront = frontVG;

    if (frontVG != null) {
      frontVG.setFeature(Feature.FORM, Form.PAST_PARTICIPLE);
      vgComponents.push(frontVG);
    }
    newFront = new InflectedWordElement("have", LexicalCategory.VERB); //$NON-NLS-1$
    newFront.setFeature(Feature.TENSE, tenseValue);
    if (modal != null) {
      newFront.setFeature(InternalFeature.NON_MORPH, true);
    }
    return newFront;
  }

  /**
   * Adds the <em>be</em> verb to the front of the group.
   * 
   * @param frontVG
   *            the first verb in the verb group.
   * @param vgComponents
   *            the stack of verb components in the verb group.
   * @param frontForm
   *            the form the current front verb is to take.
   * @return the new element for the front of the group.
   */
  static addBe(frontVG, vgComponents, frontForm){
    if (frontVG != null) {
      frontVG.setFeature(Feature.FORM, frontForm);
      vgComponents.push(frontVG);
    }
    return new InflectedWordElement("be", LexicalCategory.VERB);
  }

  static pushModal(actualModal, phrase, vgComponents){
    if (actualModal !== null && phrase.getFeatureAsBoolean('IGNORE_MODAL') == false){
      vgComponents.push(new InflectedWordElement(actualModal, 'MODAL'));
    }
    return vgComponents;
  }

  /**
   * Pushes the front verb onto the stack of verb components.
   * 
   * @param phrase
   *            the <code>PhraseElement</code> representing this noun phrase.
   * @param vgComponents
   *            the stack of verb components in the verb group.
   * @param frontVG
   *            the first verb in the verb group.
   * @param formValue
   *            the <code>Form</code> of the phrase.
   * @param interrogative
   *            <code>true</code> if the phrase is interrogative.
   */
  static pushFrontVerb(phrase, vgComponents, frontVG, formValue, interrogative){
    let interrogType = phrase.getFeature('INTERROGATIVE_TYPE');
    
    if ('GERUND' == formValue){
      frontVG.setFeature('FORM', 'PRESENT_PARTICIPLE');
      vgComponents.push(frontVG);

    } else if ('PAST_PARTICIPLE' == formValue){
      frontVG.setFeature('FORM', 'PAST_PARTICIPLE');
      vgComponents.push(frontVG);

    } else if ('PRESENT_PARTICIPLE' == formValue){
      frontVG.setFeature('FORM', 'PRESENT_PARTICIPLE');
      vgComponents.push(frontVG);

    } else if ((!(formValue == null || 'NORMAL' == formValue) || interrogative)
        && !VerbPhraseHelper.isCopular(phrase.getHead()) && vgComponents.length === 0) {

      // AG: fix below: if interrogative, only set non-morph feature in
      // case it's not WHO_SUBJECT OR WHAT_SUBJECT      
      if (!('WHO_SUBJECT' == interrogType || 'WHAT_SUBJECT' == interrogType)) {
        frontVG.setFeature('NON_MORPH', true);
      }

      vgComponents.push(frontVG);

    } else {
      let numToUse = VerbPhraseHelper.determineNumber(phrase.getParent(), phrase);
      frontVG.setFeature('TENSE', phrase.getFeature('TENSE'));
      frontVG.setFeature('PERSON', phrase.getFeature('PERSON'));
      frontVG.setFeature('NUMBER', numToUse);
      
      //don't push the front VG if it's a negated interrogative WH object question
      if (!(phrase.getFeatureAsBoolean('NEGATED') && ('WHO_OBJECT' == interrogType || 'WHAT_OBJECT' == interrogType))) {
        vgComponents.push(frontVG);
      }
    }
    return vgComponents;
  }

  static determineNumber(parent, phrase){
    let numberValue = phrase.getFeature('NUMBER');
    let number = null;
    if (numberValue != null /*&& numberValue instanceof NumberAgreement */){
      number = numberValue;
    } else {
      number = 'SINGULAR';
    }

    // Ehud Reiter = modified below to force number from VP for WHAT_SUBJECT
    // and WHO_SUBJECT interrogatuves
    if (parent instanceof PhraseElement) {
      if (parent.isA('CLAUSE') && (PhraseHelper.isExpletiveSubject(parent)
              || 'WHO_SUBJECT' == parent.getFeature('INTERROGATIVE_TYPE') 
              || 'WHAT_SUBJECT' == parent.getFeature('INTERROGATIVE_TYPE'))
            && VerbPhraseHelper.isCopular(phrase.getHead())) {

        if (this.hasPluralComplement(phrase.getFeatureAsElementList('COMPLEMENTS'))) {
          number = 'PLURAL';
        } else {
          number = 'SINGULAR';
        }
      }
    }
    return number;
  }


  /**
   * Checks to see if any of the complements to the phrase are plural.
   * 
   * @param complements
   *            the list of complements of the phrase.
   * @return <code>true</code> if any of the complements are plural.
   */
  static hasPluralComplement(complements) {
    let plural = false;
    let eachComplement = null;
    let numberValue = null;

    for(let i = 0; i < complements.length; i++){
      let eachComplement = complements[i];
    
      if (eachComplement != null && eachComplement.isA(PhraseCategory.NOUN_PHRASE)) {
        numberValue = eachComplement.getFeature(Feature.NUMBER);
        if (numberValue != null && NumberAgreement.PLURAL.equals(numberValue)) {
          plural = true;
        }
      }
    }
    return plural;
  }

  static checkImperativeInfinitive(formValue, frontVG){

    if (('IMPERATIVE' == formValue || 'INFINITIVE' == formValue || 'BARE_INFINITIVE' == formValue) && frontVG != null) {
      frontVG.setFeature('NON_MORPH', true);
    }
  }

  static pushIfModal(hasModal, phrase, frontVG, vgComponents){

    let newFront = frontVG;
    // console.log("!!!", hasModal, !phrase.getFeatureAsBoolean('IGNORE_MODAL'))
    if (hasModal && !phrase.getFeatureAsBoolean('IGNORE_MODAL')){
      if (frontVG != null) {
        frontVG.setFeature('NON_MORPH', true);
        vgComponents.push(frontVG);
      }
      newFront = null;
    }
    return newFront;
  }

  static createNot(phrase, vgComponents, frontVG, hasModal){
    let newFront = frontVG;

    if (phrase.getFeatureAsBoolean('NEGATED')){
      let factory = phrase.getFactory();

      // before adding "do", check if this is an object WH
      // interrogative
      // in which case, don't add anything as it's already done by
      // ClauseHelper
      let interrType = phrase.getFeature('INTERROGATIVE_TYPE');
      let addDo = ('WHAT_OBJECT' != interrType && 'WHO_OBJECT' != interrType);

      if (vgComponents.length !== 0 || frontVG != null && VerbPhraseHelper.isCopular(frontVG)){
        vgComponents.push(new InflectedWordElement("not", 'ADVERB'));
      } else {
        if (frontVG != null && !hasModal) {
          frontVG.setFeature('NEGATED', true);
          vgComponents.push(frontVG);
        }

        vgComponents.push(new InflectedWordElement("not", LexicalCategory.ADVERB));

        if (addDo) {
          
          if (factory != null) {
            newFront = factory.createInflectedWord("do", LexicalCategory.VERB);
          } else {
            newFront = new InflectedWordElement("do", LexicalCategory.VERB);
          }
        }
      }
    }

    return newFront;
  }

  /**
   * Checks to see if the base form of the word is copular, i.e. <em>be</em>.
   * 
   * @param element the element to be checked
   * @return <code>true</code> if the element is copular.
   */
  static isCopular(element){
    let copular = false;

    if (element instanceof InflectedWordElement) {
      copular = "be" == element.getBaseForm();

    } else if (element instanceof WordElement) {
      copular = "be" == element.getBaseForm();

    } else if (element instanceof PhraseElement) {
      // get the head and check if it's "be"
      let head = (element instanceof SPhraseSpec) ? element.getVerb() : element.getHead();

      if (head != null) {
        copular = (head instanceof WordElement && "be" == head.getBaseForm());
      }
    }

    return copular;
  }
  

  static realiseMainVerb(parent, phrase, mainVerbRealisation, realisedElement){

    let currentElement = null;
    let main = null;

    while (mainVerbRealisation.length !== 0){
      main = mainVerbRealisation.pop();
      main.setFeature('INTERROGATIVE_TYPE', phrase.getFeature('INTERROGATIVE_TYPE'));
      currentElement = parent.realise(main);

      if (currentElement != null) {
        realisedElement.addComponent(currentElement);
      }
    }
    return realisedElement;
  }


  static splitVerbGroup(vgComponents, mainVerbRealisation, auxiliaryRealisation){

    let mainVerbSeen = false;

    for (let i = 0; i < vgComponents.length; i++){
      let word = vgComponents[i];
      if (!mainVerbSeen){
        mainVerbRealisation.push(word);
        if (!word.equals("not")){
          mainVerbSeen = true;
        }
      } else {
        auxiliaryRealisation.push(word);
      }
    }

    return [mainVerbRealisation, auxiliaryRealisation];

  }

  static pushParticles(phrase, parent, vgComponents) {
    let particle = phrase.getFeature('PARTICLE');

    if (typeof particle === "string") {
      vgComponents.push(new StringElement(particle));

    } else if (particle instanceof Element) {
      vgComponents.push(parent.realise(particle));
    }
    return vgComponents;
  }

  static grabHeadVerb(phrase, tenseValue, hasModal){
    let frontVG = phrase.getHead();

    if (frontVG != null) {
      if (frontVG instanceof WordElement) {
        frontVG = new InflectedWordElement(frontVG);
      }

      // AG: tense value should always be set on frontVG
      if (tenseValue != null) {
        frontVG.setFeature('TENSE', tenseValue);
      }

      if (hasModal) {
        frontVG.setFeature('NEGATED', false);
      }
    }
    return frontVG;
  }

}

export default VerbPhraseHelper;