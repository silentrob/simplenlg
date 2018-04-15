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


import DeterminerAgrHelper from './determinerAgrHelper';
import StringElement from '../framework/stringElement';

import Form from '../features/Form';
import Tense from '../features/Tense';
import Feature from '../features/Feature';
import Inflection from '../features/Inflection';
import Person from '../features/Person';
import Gender from '../features/Gender';
import LexicalFeature from '../features/LexicalFeature';
import InternalFeature from '../features/InternalFeature';
import LexicalCategory from '../features/LexicalCategory';
import DiscourseFunction from '../features/DiscourseFunction';

import S from 'string';

const PRONOUNS = [[
        ["I", "you", "he", "she", "it"],
        ["me", "you", "him", "her", "it" ],
        ["myself", "yourself", "himself", "herself", "itself"],
        ["mine", "yours", "his", "hers", "its" ],
        ["my", "your", "his", "her", "its"]],
      [
        ["we", "you", "they", "they", "they"],
        ["us", "you", "them", "them", "them"],
        ["ourselves", "yourselves", "themselves", "themselves", "themselves"],
        ["ours", "yours", "theirs", "theirs", "theirs"],
        ["our", "your", "their", "their", "their"]
      ]
    ];
  

  const WH_PRONOUNS = ["who", "what", "which", "where", "why", "how", "how many" ];


class MorphologyRules {

  static doAdjectiveMorphology(element, baseWord){

    let realised = null;
    let patternValue = element.getFeature(LexicalFeature.DEFAULT_INFL);

    // base form from baseWord if it exists, otherwise from element
    let baseForm = MorphologyRules.getBaseForm(element, baseWord);

    if (element.getFeatureAsBoolean(Feature.IS_COMPARATIVE)){
      realised = element.getFeatureAsString(LexicalFeature.COMPARATIVE);

      if (realised == null && baseWord != null) {
        realised = baseWord.getFeatureAsString(LexicalFeature.COMPARATIVE);
      }
      if (realised == null) {
        if (Inflection.REGULAR_DOUBLE.equals(patternValue)) {
          realised = buildDoubleCompAdjective(baseForm);
        } else {
          realised = buildRegularComparative(baseForm);
        }
      }
    } else if (element.getFeatureAsBoolean(Feature.IS_SUPERLATIVE)){

      realised = element.getFeatureAsString(LexicalFeature.SUPERLATIVE);

      if (realised == null && baseWord != null) {
        realised = baseWord.getFeatureAsString(LexicalFeature.SUPERLATIVE);
      }
      if (realised == null) {
        if (Inflection.REGULAR_DOUBLE.equals(patternValue)) {
          realised = buildDoubleSuperAdjective(baseForm);
        } else {
          realised = buildRegularSuperlative(baseForm);
        }
      }
    } else {
      realised = baseForm;
    }
    let realisedElement = new StringElement(realised);
    realisedElement.setFeature(InternalFeature.DISCOURSE_FUNCTION, element.getFeature(InternalFeature.DISCOURSE_FUNCTION));
    return realisedElement;
  }

  static doNounMorphology(element, baseWord){

      let realised = "";

      // base form from baseWord if it exists, otherwise from element
      let baseForm = MorphologyRules.getBaseForm(element, baseWord);

      if (element.isPlural() && !element.getFeatureAsBoolean('PROPER')) {

        let pluralForm = null;
        let elementDefaultInfl = element.getFeature('DEFAULT_INFL');

        if (elementDefaultInfl != null && 'UNCOUNT' == elementDefaultInfl) {
          pluralForm = baseForm;
        } else {
          pluralForm = element.getFeatureAsString('PLURAL');
        }

        if (pluralForm == null && baseWord != null) {
          let baseDefaultInfl = baseWord.getFeatureAsString('DEFAULT_INFL');
          if (baseDefaultInfl != null && baseDefaultInfl == 'UNCOUNT') {
            pluralForm = baseForm;
          } else {
            pluralForm = baseWord.getFeatureAsString('PLURAL');
          }
        }

        if (pluralForm == null) {
          let pattern = element.getFeature('DEFAULT_INFL');
          if ('GRECO_LATIN_REGULAR' == pattern){
            pluralForm = buildGrecoLatinPluralNoun(baseForm);
          } else {
            pluralForm = MorphologyRules.buildRegularPluralNoun(baseForm);
          }
        }
        realised += pluralForm;
      } else {
        realised += baseForm;
      }

      realised = MorphologyRules.checkPossessive(element, realised);
      let realisedElement = new StringElement(realised.toString());
      realisedElement.setFeature('DISCOURSE_FUNCTION', element.getFeature('DISCOURSE_FUNCTION'));
      return realisedElement;
  }


  static checkPossessive(element, realised){

    if (element.getFeatureAsBoolean('POSSESSIVE')){
      if (realised.charAt(realised.length - 1) == 's'){
        realised += '\'';

      } else {
        realised += "'s";
      }
    }
    return realised;
  }

  static doDeterminerMorphology(determiner, realisation){
    if (realisation != null) {
      if (determiner.getRealisation() === "a") { 
        if (determiner.isPlural()) {
          determiner.setRealisation("some");
        } else if (DeterminerAgrHelper.requiresAn(realisation)){
          determiner.setRealisation("an");
        }
      }
    }
  }

  static doPronounMorphology(element){

    let realised = null;

    if (!element.getFeatureAsBoolean(InternalFeature.NON_MORPH) && !MorphologyRules.isWHPronoun(element)) {
      let genderValue = element.getFeature(LexicalFeature.GENDER);
      let personValue = element.getFeature(Feature.PERSON);
      let discourseValue = element.getFeature(InternalFeature.DISCOURSE_FUNCTION);

      let numberIndex = element.isPlural() ? 1 : 0;
      let genderIndex = 2;
      let personIndex = 2;

      switch (genderValue){
        case "MASCULINE": genderIndex = 0; break;
        case "FEMININE": genderIndex = 1; break;
        case "NEUTER": genderIndex = 2; break;
      }
      
      switch (personValue){
        case "FIRST": personIndex = 0;  break;
        case "SECOND": personIndex = 1; break;
        case "THIRD": personIndex = 2; break;
      }

      if (personIndex == 2) {
        personIndex += genderIndex;
      }

      let positionIndex = 0;

      if (element.getFeatureAsBoolean(LexicalFeature.REFLEXIVE)){
        positionIndex = 2;
      } else if (element.getFeatureAsBoolean(Feature.POSSESSIVE)){
        positionIndex = 3;
        if (DiscourseFunction.SPECIFIER == discourseValue){
          positionIndex++;
        }
      } else {
        positionIndex = (DiscourseFunction.SUBJECT == discourseValue && !element.getFeatureAsBoolean(Feature.PASSIVE))
            || (DiscourseFunction.OBJECT == discourseValue && element.getFeatureAsBoolean(Feature.PASSIVE))
            || DiscourseFunction.SPECIFIER == discourseValue
            || (DiscourseFunction.COMPLEMENT == discourseValue && element.getFeatureAsBoolean(Feature.PASSIVE)) ? 0 : 1;
      }

      realised = PRONOUNS[numberIndex][positionIndex][personIndex];
    } else {
      realised = element.getBaseForm();
    }
    let realisedElement = new StringElement(realised);
    realisedElement.setFeature(InternalFeature.DISCOURSE_FUNCTION, element.getFeature(InternalFeature.DISCOURSE_FUNCTION));
    return realisedElement;
  }

  static doVerbMorphology(element, baseWord){

    let realised = null;
    let numberValue = element.getFeature('NUMBER');
    let personValue = element.getFeature('PERSON');
    let tense = element.getFeature('TENSE');
    let tenseValue = (tense) ? tense : 'PRESENT';


    let formValue = element.getFeature('FORM');
    let patternValue = element.getFeature('DEFAULT_INFL');

    // base form from baseWord if it exists, otherwise from element
    let baseForm = MorphologyRules.getBaseForm(element, baseWord);

    if (element.getFeatureAsBoolean('NEGATED') || 'BARE_INFINITIVE' == formValue){
      realised = baseForm;
    } else if ('PRESENT_PARTICIPLE' ==  formValue){
      realised = element.getFeatureAsString('PRESENT_PARTICIPLE');

      if (realised == null && baseWord != null) {
        realised = baseWord.getFeatureAsString('PRESENT_PARTICIPLE');
      }

      if (realised == null) {
        if ('REGULAR_DOUBLE' == patternValue){
          realised = buildDoublePresPartVerb(baseForm);
        } else {
          realised = MorphologyRules.buildRegularPresPartVerb(baseForm);
        }
      }

    } else if (tenseValue == Tense.PAST  || formValue == Form.PAST_PARTICIPLE){

      if (Form.PAST_PARTICIPLE == formValue){
        realised = element.getFeatureAsString(LexicalFeature.PAST_PARTICIPLE);

        if (realised == null && baseWord != null){
          realised = baseWord.getFeatureAsString(LexicalFeature.PAST_PARTICIPLE);
        }

        if (realised == null){
          if ("be" == baseForm){
            realised = "been";
          } else if (Inflection.REGULAR_DOUBLE == patternValue){
            realised = buildDoublePastVerb(baseForm);
          } else {
            realised = MorphologyRules.buildRegularPastVerb(baseForm, numberValue, personValue);
          }
        }

      } else {
        realised = element.getFeatureAsString('PAST');

        if (realised == null && baseWord != null) {
          realised = baseWord.getFeatureAsString('PAST');
        }

        if (realised == null) {
          if ('REGULAR_DOUBLE' == patternValue){
            realised = buildDoublePastVerb(baseForm);
          } else {
            realised = MorphologyRules.buildRegularPastVerb(baseForm, numberValue, personValue);
          }
        }
      }

    } else if ((numberValue == null || 'SINGULAR' == numberValue)
        && (personValue == null || 'THIRD' == personValue)
        && (tenseValue == null || 'PRESENT' == tenseValue)){

      realised = element.getFeatureAsString('PRESENT3S');

      if (realised == null && baseWord != null && "be" != baseForm){
        realised = baseWord.getFeatureAsString('PRESENT3S');
      }
      if (realised == null) {
        realised = MorphologyRules.buildPresent3SVerb(baseForm);
      }

    } else {
      if ("be" == baseForm ){
        if ('FIRST' == personValue && ('SINGULAR' == numberValue || numberValue == null)) {
          realised = "am";
        } else {
          realised = "are";
        }
      } else {
        realised = baseForm;
      }
    }
    let realisedElement = new StringElement(realised);
    realisedElement.setFeature('DISCOURSE_FUNCTION', element.getFeature('DISCOURSE_FUNCTION'));
    return realisedElement;
  }

  /**
   * Builds the present participle form for regular verbs. The rules are
   * performed in this order:
   * <ul>
   * <li>If the verb is <em>be</em> then the realised form is <em>being</em>.</li>
   * <li>For verbs ending <em>-ie</em> the ending becomes <em>-ying</em>. For
   * example, <em>tie</em> becomes <em>tying</em>.</li>
   * <li>For verbs ending <em>-ee</em>, <em>-oe</em> or <em>-ye</em> then
   * <em>-ing</em> is added to the end. For example, <em>canoe</em> becomes
   * <em>canoeing</em>.</li>
   * <li>For other verbs ending in <em>-e</em> the ending becomes
   * <em>-ing</em>. For example, <em>chase</em> becomes <em>chasing</em>.</li>
   * <li>For all other verbs, <em>-ing</em> is added to the end. For example,
   * <em>dry</em> becomes <em>drying</em>.</li>
   * </ul>
   * 
   * @param baseForm
   *            the base form of the word.
   * @param number
   *            the number agreement for the word.
   * @return the inflected word.
   */
  static buildRegularPresPartVerb(baseForm) {
    let morphology = null;
    if (baseForm != null) {
      if (baseForm == "be"){
        morphology = "being";
      } else if (S(baseForm).endsWith("ie")){
        morphology = baseForm.replaceAll("ie\b", "ying");
      } else if (/.*[^iyeo]e\b/.test(baseForm)){
        morphology = baseForm.replaceAll("e\b", "ing");
      } else {
        morphology = baseForm + "ing";
      }
    }
    return morphology;
  }


  static doAdverbMorphology(element, baseWord){

    let realised = null;

    // base form from baseWord if it exists, otherwise from element
    let baseForm = MorphologyRules.getBaseForm(element, baseWord);

    if (element.getFeatureAsBoolean('IS_COMPARATIVE')) {
      realised = element.getFeatureAsString('COMPARATIVE');

      if (realised == null && baseWord != null) {
        realised = baseWord.getFeatureAsString('COMPARATIVE');
      }
      if (realised == null) {
        realised = MorphologyRules.buildRegularComparative(baseForm);
      }
    } else if (element.getFeatureAsBoolean('IS_SUPERLATIVE')){

      realised = element.getFeatureAsString('SUPERLATIVE');

      if (realised == null && baseWord != null) {
        realised = baseWord.getFeatureAsString('SUPERLATIVE');
      }
      if (realised == null) {
        realised = MorphologyRules.buildRegularSuperlative(baseForm);
      }
    } else {
      realised = baseForm;
    }
    let realisedElement = new StringElement(realised);
    realisedElement.setFeature('DISCOURSE_FUNCTION', element.getFeature('DISCOURSE_FUNCTION'));
    return realisedElement;
  }

  static buildRegularComparative(baseForm){
    let morphology = null;
    if (baseForm != null) {
      if (/.*[b-z&&[^eiou]]y\b/.test(baseForm)){ 
        morphology = baseForm.replaceAll("y\b", "ier");
      } else if (baseForm.charAt(baseForm.length - 1) == "e"){ 
        morphology = baseForm + "r"; 
      } else {
        morphology = baseForm + "er"; 
      }
    }
    return morphology;
  }

  static buildRegularPluralNoun(baseForm){
    let plural = null;
    if (baseForm != null) {
      if (/.*[b-z&&[^eiou]]y\b/.test(baseForm)){
        plural = baseForm.replaceAll("y\b", "ies");
      } else if (/.*([szx]|[cs]h)\b/.test(baseForm)){
        plural = baseForm + "es";
      } else {
        plural = baseForm + "s";
      }
    }

    return plural;
  }

  static buildRegularPastVerb(baseForm, number, person){
    let morphology = null;
    if (baseForm != null) {
      if (baseForm == "be"){
        if ('PLURAL' == number){
          morphology = "were";
        } else if ('SECOND' == person) {
          morphology = "were";
        } else {
          morphology = "was";
        }
      } else if (baseForm.charAt(baseForm.length - 1) == "e") {
        morphology = baseForm + "d";
      } else if (/.*[b-z&&[^eiou]]y\b/.test(baseForm)){
        morphology = baseForm.replaceAll("y\b", "ied");
      } else {
        morphology = baseForm + "ed";
      }
    }
    return morphology;
  }


  static buildRegularSuperlative(baseForm){
    let morphology = null;
    if (baseForm != null) {
      if (/.*[b-z&&[^eiou]]y\b/.test(baseForm)){ 
        morphology = baseForm.replaceAll("y\b", "iest");
      } else if (baseForm.charAt(baseForm.length - 1) == "e"){ 
        morphology = baseForm + "st"; 
      } else {
        morphology = baseForm + "est"; 
      }
    }
    return morphology;
  }


  static buildPresent3SVerb(baseForm){
    let morphology = null;
    if (baseForm != null) {
      if (baseForm == "be"){
        morphology = "is"; 
      } else if (/.*[szx(ch)(sh)]\b/.test(baseForm)) { 
        morphology = baseForm + "es"; 
      } else if (/.*[b-z&&[^eiou]]y\b/.test(baseForm)) { 
        morphology = baseForm.replaceAll("y\b", "ies");
      } else {
        morphology = baseForm + "s"; 
      }
    }
    return morphology;
  }


  static getBaseForm(element, baseWord){
    // unclear what the right behaviour should be
    // for now, prefer baseWord.getBaseForm() to element.getBaseForm() for
    // verbs (ie, "is" mapped to "be")
    // but prefer element.getBaseForm() to baseWord.getBaseForm() for other
    // words (ie, "children" not mapped to "child")

    // AG: changed this to get the default spelling variant
    // needed to preserve spelling changes in the VP

    if (element.getCategory() === 'VERB'){
      if (baseWord != null && baseWord.getDefaultSpellingVariant() != null){
        return baseWord.getDefaultSpellingVariant();
      } else{
        return element.getBaseForm();
      }
    } else {
      if (element.getBaseForm() != null){
        return element.getBaseForm();
      } else if (baseWord == null){
        return null;
      } else {
        return baseWord.getDefaultSpellingVariant();
      }
    }
  }

  static isWHPronoun(word){
    let base = word.getBaseForm();
    let wh = false;
    if (base != null) {
      for (let i = 0; i < WH_PRONOUNS.length && !wh; i++) {
        wh = WH_PRONOUNS[i] == base;
      }
    }

    return wh;

  }
}

export default MorphologyRules;