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
import CoordinatedPhraseElement from '../framework/coordinatedPhraseElement';
import PhraseElement from '../framework/phraseElement';
import PhraseHelper from './PhraseHelper';
import VerbPhraseHelper from './VerbPhraseHelper';
import SPhraseSpec from '../phraseSpec/SPhraseSpec';
import VPPhraseSpec from '../phraseSpec/VPPhraseSpec';

import InternalFeature from '../features/InternalFeature';
import LexicalCategory from '../features/LexicalCategory';
import Feature from '../features/Feature';
import Tense from '../features/Tense';
import InterrogativeType from '../features/interrogativeType';
import DiscourseFunction from '../features/DiscourseFunction';
import Form from '../features/Form';

class ClauseHelper {

  static realise(parent, phrase){
    let realisedElement = null;
    let phraseFactory = phrase.getFactory();
    let splitVerb = null;
    let interrogObj = false;

    if(phrase != null){
      realisedElement = new ListElement();
      let verbElement = phrase.getFeatureAsElement('VERB_PHRASE');

      if(verbElement == null) {
        verbElement = phrase.getHead();
      }

      verbElement = ClauseHelper.checkSubjectNumberPerson(phrase, verbElement);

      phrase = ClauseHelper.checkDiscourseFunction(phrase);
      verbElement = ClauseHelper.copyFrontModifiers(phrase, verbElement);
      realisedElement = ClauseHelper.addComplementiser(phrase, parent, realisedElement);
      realisedElement = ClauseHelper.addCuePhrase(phrase, parent, realisedElement);

      if(phrase.hasFeature('INTERROGATIVE_TYPE')){
        let inter = phrase.getFeature('INTERROGATIVE_TYPE');
        interrogObj = (inter.equals('WHAT_OBJECT') || inter.equals('WHO_OBJECT') || inter.equals('HOW_PREDICATE') || inter.equals('HOW') || inter.equals('WHY') || inter.equals('WHERE'))
        splitVerb = ClauseHelper.realiseInterrogative(phrase, parent, realisedElement, phraseFactory, verbElement);
      } else {
        realisedElement = PhraseHelper.realiseList(parent, realisedElement, phrase.getFeatureAsElementList('FRONT_MODIFIERS'), 'FRONT_MODIFIER');
      }

      realisedElement = ClauseHelper.addSubjectsToFront(phrase, parent, realisedElement, splitVerb);
      let passiveSplitVerb = ClauseHelper.addPassiveComplementsNumberPerson(phrase, parent, realisedElement, verbElement);

      if(passiveSplitVerb != null){
        splitVerb = passiveSplitVerb;
      }

      // realise verb needs to know if clause is object interrogative
      realisedElement = ClauseHelper.realiseVerb(phrase, parent, realisedElement, splitVerb, verbElement, interrogObj);
      realisedElement = ClauseHelper.addPassiveSubjects(phrase, parent, realisedElement, phraseFactory);
      realisedElement = ClauseHelper.addInterrogativeFrontModifiers(phrase, parent, realisedElement);
      realisedElement = ClauseHelper.addEndingTo(phrase, parent, realisedElement, phraseFactory);
    }
    
    return realisedElement;
  }

  // Adds <em>to</em> to the end of interrogatives concerning indirect
  static addEndingTo(phrase, parent, realisedElement, phraseFactory){
    if('WHO_INDIRECT_OBJECT' == phrase.getFeature('INTERROGATIVE_TYPE')){
      let word = phraseFactory.createWord('to', 'PREPOSITION');
      realisedElement.addComponent(parent.realise(word));
    }
    return realisedElement;
  }

  static addInterrogativeFrontModifiers(phrase, parent, realisedElement){
    let currentElement = null;
    if(phrase.hasFeature('INTERROGATIVE_TYPE')){
      let front_modifiers = phrase.getFeatureAsElementList('FRONT_MODIFIERS');
      for(let i = 0; i < front_modifiers.length; i++){
        let subject = front_modifiers[i];
        currentElement = parent.realise(subject);
        if(currentElement != null) {
          currentElement.setFeature('DISCOURSE_FUNCTION', 'FRONT_MODIFIER');
          realisedElement.addComponent(currentElement);
        }
      }
    }
    return realisedElement;
  }

  static addPassiveSubjects(phrase, parent, realisedElement, phraseFactory){
    let currentElement = null;

    if(phrase.getFeatureAsBoolean('PASSIVE')){
      let allSubjects = phrase.getFeatureAsElementList('SUBJECTS');

      if(allSubjects.length > 0 || phrase.hasFeature('INTERROGATIVE_TYPE')){
        realisedElement.addComponent(parent.realise(phraseFactory.createPrepositionPhrase("by")));
      }

      for(let i = 0; i < allSubjects.length; i++){
        let subject = allSubjects[i];
        subject.setFeature('PASSIVE', true);
        if(subject.isA('NOUN_PHRASE') || subject instanceof CoordinatedPhraseElement) {
          currentElement = parent.realise(subject);
          if(currentElement != null) {
            currentElement.setFeature('DISCOURSE_FUNCTION', 'SUBJECT');
            realisedElement.addComponent(currentElement);
          }
        }
      }
    }

    return realisedElement;
  }

  static realiseVerb(phrase, parent, realisedElement, splitVerb, verbElement, whObj){
    let currentElement = parent.realise(verbElement);
    if(currentElement != null){
      if(splitVerb == null){
        currentElement.setFeature('DISCOURSE_FUNCTION', 'VERB_PHRASE');
        realisedElement.addComponent(currentElement);
      } else {
        if(currentElement instanceof ListElement){
          let children = currentElement.getChildren();
          currentElement = children[0];
          currentElement.setFeature('DISCOURSE_FUNCTION', 'VERB_PHRASE');
          realisedElement.addComponent(currentElement);
          realisedElement.addComponent(splitVerb);

          for(let eachChild = 1; eachChild < children.length; eachChild++ ){
            currentElement = children[eachChild];
            currentElement.setFeature('DISCOURSE_FUNCTION', 'VERB_PHRASE');
            realisedElement.addComponent(currentElement);
          }
        } else {
          currentElement.setFeature('DISCOURSE_FUNCTION', 'VERB_PHRASE');

          if(whObj) {
            realisedElement.addComponent(currentElement);
            realisedElement.addComponent(splitVerb);
          } else {
            realisedElement.addComponent(splitVerb);
            realisedElement.addComponent(currentElement);
          }
        }
      }
    }
    return realisedElement;
  }

  /**
   * Realises the complements of passive clauses; also sets number, person for
   * passive
   * 
   * @param phrase
   *            the <code>PhraseElement</code> representing this clause.
   * @param parent
   *            the parent <code>SyntaxProcessor</code> that will do the
   *            realisation of the complementiser.
   * @param realisedElement
   *            the current realisation of the clause.
   * @param verbElement
   *            the <code>NLGElement</code> representing the verb phrase for
   *            this clause.
   */
  static addPassiveComplementsNumberPerson(phrase, parent, realisedElement, verbElement){
    let passiveNumber = null;
    let passivePerson = null;
    let currentElement = null;
    let splitVerb = null;
    let verbPhrase = phrase.getFeatureAsElement('VERB_PHRASE');

    // count complements to set plural feature if more than one
    let numComps = 0;
    let coordSubj = false;

  
    if(phrase.getFeatureAsBoolean('PASSIVE') && verbPhrase != null && 'WHAT_OBJECT' != phrase.getFeature('INTERROGATIVE_TYPE')){


      // complements of a clause are stored in the VPPhraseSpec
      for(let x = 0; x < verbPhrase.getFeatureAsElementList('COMPLEMENTS').length; x++){
        let subject = verbPhrase.getFeatureAsElementList('COMPLEMENTS')[x];

        if(subject.getFeature('DISCOURSE_FUNCTION') == 'OBJECT'){
          subject.setFeature('PASSIVE', true);
          numComps += 1;
          currentElement = parent.realise(subject);

          if(currentElement != null) {
            currentElement.setFeature('DISCOURSE_FUNCTION', 'OBJECT');
            if(phrase.hasFeature('INTERROGATIVE_TYPE')) {
              splitVerb = currentElement;
            } else {
              realisedElement.addComponent(currentElement);
            }
          }

          // flag if passive subject is coordinated with an "and"
          if(!coordSubj && subject instanceof CoordinatedPhraseElement) {
            let conj = subject.getConjunction();
            coordSubj = (conj != null && conj.equals("and"));
          }

          if(passiveNumber == null) {
            passiveNumber = subject.getFeature('NUMBER');
          } else {
            passiveNumber = 'PLURAL';
          }

          if('FIRST' == subject.getFeature('PERSON')) {
            passivePerson = 'FIRST';
          } else if('SECOND' == subject.getFeature('PERSON') && 'FIRST' != passivePerson){
            passivePerson = 'SECOND';
          } else if(passivePerson == null) {
            passivePerson = 'THIRD';
          }

          if('GERUND' == phrase.getFeature('FORM') && !phrase.getFeatureAsBoolean('SUPPRESS_GENITIVE_IN_GERUND')){
            subject.setFeature('POSSESSIVE', true);
          }
        }
      }
    }
    return splitVerb;
  }

  static addSubjectsToFront(phrase, parent, realisedElement, splitVerb){
    if('INFINITIVE' != phrase.getFeature('FORM')
       && 'IMPERATIVE' != phrase.getFeature('FORM')
       && !phrase.getFeatureAsBoolean('PASSIVE') && splitVerb == null){
      realisedElement.addComponents(ClauseHelper.realiseSubjects(phrase, parent).getChildren());
    }
    return realisedElement;
  }

  static addComplementiser(phrase, parent, realisedElement){
    let currentElement;
    if ('SUBORDINATE' == phrase.getFeature('CLAUSE_STATUS') && !phrase.getFeatureAsBoolean('SUPRESSED_COMPLEMENTISER')){
      currentElement = parent.realise(phrase.getFeatureAsElement('COMPLEMENTISER'));
      if(currentElement != null){
        realisedElement.addComponent(currentElement);
      }
    }
    return realisedElement;
  }

  static addCuePhrase(phrase, parent, realisedElement){
    let currentElement = parent.realise(phrase.getFeatureAsElement('CUE_PHRASE'));
    if(currentElement != null) {
      currentElement.setFeature('DISCOURSE_FUNCTION', 'CUE_PHRASE');
      realisedElement.addComponent(currentElement);
    }
    return realisedElement;
  }


  static checkSubjectNumberPerson(phrase, verbElement){
    let currentElement = null;
    let subjects = phrase.getFeatureAsElementList('SUBJECTS');
    let pluralSubjects = false;
    let person = null;

    if(subjects != null) {
      switch(subjects.length){
      case 0 :
        break;
      case 1 :
        currentElement = subjects[0];
        // coordinated NP with "and" are plural (not coordinated NP with
        // "or")
        if(currentElement instanceof CoordinatedPhraseElement && currentElement.checkIfPlural()){
          pluralSubjects = true;
        } else if((currentElement.getFeature('NUMBER') == 'PLURAL') && !(currentElement instanceof SPhraseSpec)){
          pluralSubjects = true;
        } else if(currentElement.isA('NOUN_PHRASE')){
          let currentHead = currentElement.getFeatureAsElement('HEAD');
          person = currentElement.getFeature('PERSON');
          if(currentHead == null) {
            // subject is null and therefore is not gonna be plural
            pluralSubjects = false;
          } else if((currentHead.getFeature('NUMBER') == 'PLURAL'))
            pluralSubjects = true;
          else if(currentHead instanceof ListElement) {
            pluralSubjects = true;
          }
        }
        break;

      default :
        pluralSubjects = true;
        break;
      }
    }

    if(verbElement != null) {
      verbElement.setFeature('NUMBER', pluralSubjects ? 'PLURAL' : phrase.getFeature('NUMBER'));
      if(person != null){
        verbElement.setFeature('PERSON', person);
      }
    }
    return verbElement;
  }

  static checkDiscourseFunction(phrase){
    let subjects = phrase.getFeatureAsElementList('SUBJECTS');
    let clauseForm = phrase.getFeature('FORM');
    let discourseValue = phrase.getFeature('DISCOURSE_FUNCTION');

    if('OBJECT' == discourseValue || 'INDIRECT_OBJECT' == discourseValue){
      if('IMPERATIVE' == clauseForm){
        phrase.setFeature('SUPRESSED_COMPLEMENTISER', true);
        phrase.setFeature('FORM', 'INFINITIVE');
      } else if('GERUND' == clauseForm && subjects.length == 0) {
        phrase.setFeature('SUPRESSED_COMPLEMENTISER', true);
      }
    } else if('SUBJECT' == discourseValue){
      phrase.setFeature('FORM','GERUND');
      phrase.setFeature('SUPRESSED_COMPLEMENTISER', true);
    }
    return phrase;
  }

  static copyFrontModifiers(phrase, verbElement){
    let frontModifiers = phrase.getFeatureAsElementList('FRONT_MODIFIERS');
    let clauseForm = phrase.getFeature('FORM');

    if(verbElement != null) {
      let phrasePostModifiers = phrase.getFeatureAsElementList('POSTMODIFIERS');

      if(verbElement instanceof PhraseElement) {
        let verbPostModifiers = verbElement.getFeatureAsElementList('POSTMODIFIERS');

        for (let x = 0; x < phrasePostModifiers.length; x++){
          let eachModifier = phrasePostModifiers[x];
          if(verbPostModifiers.indexOf(eachModifier) == -1) {
            verbElement.addPostModifier(eachModifier);
          }
        }
      }
    }

    if('INFINITIVE' == clauseForm){
      phrase.setFeature('SUPRESSED_COMPLEMENTISER', true);

      for (let x = 0; x < frontModifiers.length; x++){
        let eachModifier = frontModifiers[x];
        if(verbElement instanceof PhraseElement) {
          verbElement.addPostModifier(eachModifier);
        }
      }
      phrase.removeFeature('FRONT_MODIFIERS');
      if(verbElement != null) {
        verbElement.setFeature('NON_MORPH', true);
      }
    }
    return verbElement;
  }


  /**
   * This is the main controlling method for handling interrogative clauses.
   * The actual steps taken are dependent on the type of question being asked.
   * The method also determines if there is a subject that will split the verb
   * group of the clause. For example, the clause
   * <em>the man <b>should give</b> the woman the flower</em> has the verb
   * group indicated in <b>bold</b>. The phrase is rearranged as yes/no
   * question as
   * <em><b>should</b> the man <b>give</b> the woman the flower</em> with the
   * subject <em>the man</em> splitting the verb group.
   * 
   * @param phrase
   *            the <code>PhraseElement</code> representing this clause.
   * @param parent
   *            the parent <code>SyntaxProcessor</code> that will do the
   *            realisation of the complementiser.
   * @param realisedElement
   *            the current realisation of the clause.
   * @param phraseFactory
   *            the phrase factory to be used.
   * @param verbElement
   *            the <code>NLGElement</code> representing the verb phrase for
   *            this clause.
   * @return an <code>NLGElement</code> representing a subject that should
   *         split the verb
   */
  static realiseInterrogative(phrase, parent, realisedElement, phraseFactory, verbElement){
    let splitVerb = null;

    if(phrase.getParent() != null) {
      phrase.getParent().setFeature(InternalFeature.INTERROGATIVE, true);
    }

    let type = phrase.getFeature(Feature.INTERROGATIVE_TYPE);

    if(type instanceof InterrogativeType) {
      switch(type.name) {
      case "YES_NO" :
        splitVerb = this.realiseYesNo(phrase, parent, verbElement, phraseFactory, realisedElement);
        break;

      case "WHO_SUBJECT" :
      case "WHAT_SUBJECT" :
        this.realiseInterrogativeKeyWord(InterrogativeType.getString(type), LexicalCategory.PRONOUN, parent, realisedElement, phraseFactory);
        phrase.removeFeature(InternalFeature.SUBJECTS);
        break;

      case "HOW_MANY" :
        this.realiseInterrogativeKeyWord("how", LexicalCategory.PRONOUN, parent, realisedElement, phraseFactory);
        this.realiseInterrogativeKeyWord("many", LexicalCategory.ADVERB, parent, realisedElement, phraseFactory);
        break;

      case "HOW" :
      case "WHY" :
      case "WHERE" :
      case "WHO_OBJECT" :
      case "WHO_INDIRECT_OBJECT" :
      case "WHAT_OBJECT" :
        splitVerb = this.realiseObjectWHInterrogative(InterrogativeType.getString(type), phrase, parent, realisedElement, phraseFactory);
        break;

      case "HOW_PREDICATE" :
        splitVerb = this.realiseObjectWHInterrogative("how", phrase, parent, realisedElement, phraseFactory);
        break;

      default :
        break;
      }
    }

    return splitVerb;
  }

  /**
   * Performs the realisation for YES/NO types of questions. This may involve
   * adding an optional <em>do</em> auxiliary verb to the beginning of the
   * clause. The method also determines if there is a subject that will split
   * the verb group of the clause. For example, the clause
   * <em>the man <b>should give</b> the woman the flower</em> has the verb
   * group indicated in <b>bold</b>. The phrase is rearranged as yes/no
   * question as
   * <em><b>should</b> the man <b>give</b> the woman the flower</em> with the
   * subject <em>the man</em> splitting the verb group.
   * 
   * 
   * @param phrase
   *            the <code>PhraseElement</code> representing this clause.
   * @param parent
   *            the parent <code>SyntaxProcessor</code> that will do the
   *            realisation of the complementiser.
   * @param realisedElement
   *            the current realisation of the clause.
   * @param phraseFactory
   *            the phrase factory to be used.
   * @param verbElement
   *            the <code>NLGElement</code> representing the verb phrase for
   *            this clause.
   * @param subjects
   *            the <code>List</code> of subjects in the clause.
   * @return an <code>NLGElement</code> representing a subject that should
   *         split the verb
   */
  static realiseYesNo(phrase, parent, verbElement, phraseFactory, realisedElement){
    let splitVerb = null;

    if(!(verbElement instanceof VPPhraseSpec && VerbPhraseHelper.isCopular(verbElement.getVerb()))
       && !phrase.getFeatureAsBoolean(Feature.PROGRESSIVE) && !phrase.hasFeature(Feature.MODAL)
       && !Tense.FUTURE.equals(phrase.getFeature(Feature.TENSE))
       && !phrase.getFeatureAsBoolean(Feature.NEGATED)
       && !phrase.getFeatureAsBoolean(Feature.PASSIVE)){
      realisedElement = this.addDoAuxiliary(phrase, parent, phraseFactory, realisedElement);
    } else {
      splitVerb = this.realiseSubjects(phrase, parent);
    }
    return splitVerb;
  }


  /**
   * Realises the subjects for the clause.
   * 
   * @param phrase
   *            the <code>PhraseElement</code> representing this clause.
   * @param parent
   *            the parent <code>SyntaxProcessor</code> that will do the
   *            realisation of the complementiser.
   * @param realisedElement
   *            the current realisation of the clause.
   */
  static realiseSubjects(phrase, parent){
    let currentElement = null;
    let realisedElement = new ListElement();

    for(let i = 0; i < phrase.getFeatureAsElementList(InternalFeature.SUBJECTS).length; i++){
      let subject = phrase.getFeatureAsElementList(InternalFeature.SUBJECTS)[i];

      subject.setFeature(InternalFeature.DISCOURSE_FUNCTION, DiscourseFunction.SUBJECT);
      if(Form.GERUND.equals(phrase.getFeature(Feature.FORM))
         && !phrase.getFeatureAsBoolean(Feature.SUPPRESS_GENITIVE_IN_GERUND)) {
        subject.setFeature(Feature.POSSESSIVE, true);
      }
      currentElement = parent.realise(subject);
      if(currentElement != null) {
        realisedElement.addComponent(currentElement);
      }
    }
    return realisedElement;
  }

  /**
   * Adds a <em>do</em> verb to the realisation of this clause.
   * 
   * @param phrase
   *            the <code>PhraseElement</code> representing this clause.
   * @param parent
   *            the parent <code>SyntaxProcessor</code> that will do the
   *            realisation of the complementiser.
   * @param realisedElement
   *            the current realisation of the clause.
   * @param phraseFactory
   *            the phrase factory to be used.
   */
  static addDoAuxiliary(phrase, parent, phraseFactory, realisedElement){

    let doPhrase = phraseFactory.createVerbPhrase("do");
    doPhrase.setFeature(Feature.TENSE, phrase.getFeature(Feature.TENSE));
    doPhrase.setFeature(Feature.PERSON, phrase.getFeature(Feature.PERSON));
    doPhrase.setFeature(Feature.NUMBER, phrase.getFeature(Feature.NUMBER));
    realisedElement.addComponent(parent.realise(doPhrase));
    return realisedElement;
  }

  /**
   * Realises the key word of the interrogative. For example, <em>who</em>,
   * <em>what</em>
   * 
   * @param keyWord
   *            the key word of the interrogative.
   * @param cat
   *            the category (usually pronoun, but not in the case of
   *            "how many")
   * @param parent
   *            the parent <code>SyntaxProcessor</code> that will do the
   *            realisation of the complementiser.
   * @param realisedElement
   *            the current realisation of the clause.
   * @param phraseFactory
   *            the phrase factory to be used.
   */
  static realiseInterrogativeKeyWord(keyWord, cat, parent, realisedElement, phraseFactory){
    if(keyWord != null) {
      let question = phraseFactory.createWord(keyWord, cat);
      let currentElement = parent.realise(question);

      if(currentElement != null) {
        realisedElement.addComponent(currentElement);
      }
    }
  }

  /**
   * Controls the realisation of <em>wh</em> object questions.
   * 
   * @param keyword
   *            the wh word
   * @param phrase
   *            the <code>PhraseElement</code> representing this clause.
   * @param parent
   *            the parent <code>SyntaxProcessor</code> that will do the
   *            realisation of the complementiser.
   * @param realisedElement
   *            the current realisation of the clause.
   * @param phraseFactory
   *            the phrase factory to be used.
   * @param subjects
   *            the <code>List</code> of subjects in the clause.
   * @return an <code>NLGElement</code> representing a subject that should
   *         split the verb
   */
  static realiseObjectWHInterrogative(keyword, phrase, parent, realisedElement, phraseFactory){
    let splitVerb = null;
    this.realiseInterrogativeKeyWord(keyword, LexicalCategory.PRONOUN, parent, realisedElement, phraseFactory);

    if(!this.hasAuxiliary(phrase) && !VerbPhraseHelper.isCopular(phrase)){
      this.addDoAuxiliary(phrase, parent, phraseFactory, realisedElement);
    } else if(!phrase.getFeatureAsBoolean(Feature.PASSIVE)){
      splitVerb = this.realiseSubjects(phrase, parent);
    }

    return splitVerb;
  }

  /*
   * Check if a sentence has an auxiliary (needed to relise questions
   * correctly)
   */
  static hasAuxiliary(phrase){
    return phrase.hasFeature(Feature.MODAL) || phrase.getFeatureAsBoolean(Feature.PERFECT)
           || phrase.getFeatureAsBoolean(Feature.PROGRESSIVE)
           || Tense.FUTURE.equals(phrase.getFeature(Feature.TENSE));
  }


}

export default ClauseHelper;