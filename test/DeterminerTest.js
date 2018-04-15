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


import Lexicon from '../src/lexicon/lexicon';
import NPPhraseSpec from '../src/phraseSpec/NPPhraseSpec';
import Realiser from '../src/realiser/Realiser';

import StringElement from '../src/framework/stringElement';
import WordElement from '../src/framework/wordElement';
import InflectedWordElement from '../src/framework/inflectedWordElement';
import PhraseElement from '../src/framework/phraseElement';
import CoordinatedPhraseElement from '../src/framework/coordinatedPhraseElement';
import NLG from '../src/framework/nlg';

import NumberAgreement from '../src/features/NumberAgreement';
import Feature from '../src/features/Feature';
import Gender from '../src/features/Gender';
import LexicalFeature from '../src/features/LexicalFeature';
import Person from '../src/features/Person';
import InternalFeature from '../src/features/InternalFeature';
import Tense from '../src/features/Tense';

import LexicalCategory from '../src/features/LexicalCategory';

import mocha from 'mocha';
import should from 'should/as-function';

const lexicon = new Lexicon('small-lexicon.xml');
const nlg = new NLG(lexicon);
const realiser = new Realiser(lexicon);

describe('DeterminerTest', () => { 

  it("testLowercaseConstant", (done) => {
    let sentence = nlg.createClause();
    let subject = nlg.createNounPhrase("a", "dog");
    sentence.setSubject(subject);
    should(realiser.realiseSentence(sentence)).eql("A dog.");
    done();
  });


  /**
   * testLowercaseVowel - Test for "an" as a specifier.
   */
  it("testLowercaseVowel", (done) => {
    let sentence = nlg.createClause();
    let subject = nlg.createNounPhrase("a", "owl");
    sentence.setSubject(subject);
  
    should(realiser.realiseSentence(sentence)).eql("An owl.");
    done();
  });
  
  /**
   * testUppercaseConstant - Test for when there is a upper case constant
   */
  it("testUppercaseConstant", (done) => {
    let sentence = nlg.createClause();
    let subject = nlg.createNounPhrase("a", "Cat");
    sentence.setSubject(subject);  
    should(realiser.realiseSentence(sentence)).eql("A Cat.");
    done();
  });
  
  /**
   * testUppercaseVowel - Test for "an" as a specifier for upper subjects.
   */
  it("testUppercaseVowel", (done) => {
    let sentence = nlg.createClause();    
    let subject = nlg.createNounPhrase("a", "Emu");
    sentence.setSubject(subject);
    should(realiser.realiseSentence(sentence)).eql("An Emu.");
    done();
  });
  
  /**
   * testNumericA - Test for "a" specifier with a numeric subject 
   */
  it("testNumericA", (done) => {
    let sentence = nlg.createClause();
    let subject = nlg.createNounPhrase("a", "7");
    sentence.setSubject(subject);
    should(realiser.realiseSentence(sentence)).eql("A 7.");
    done();
  });
  
  /**
   * testNumericAn - Test for "an" specifier with a numeric subject 
   */
  it("testNumericAn", (done) => {
  
    let sentence = nlg.createClause();
    
    let subject = nlg.createNounPhrase("a", "11");
    sentence.setSubject(subject);
  
    should(realiser.realiseSentence(sentence)).eql("An 11.");
    done();
  });
  
  /**
   * testIrregularSubjects - Test irregular subjects that don't conform to the
   * vowel vs. constant divide. 
   */
  it("testIrregularSubjects", (done) => {
  
    let sentence = nlg.createClause();
    let subject = nlg.createNounPhrase("a", "one");
    sentence.setSubject(subject);
    should(realiser.realiseSentence(sentence)).eql("A one.");
    done();
  });


});



