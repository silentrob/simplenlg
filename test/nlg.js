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


// get string for head of constituent
let getBaseForm = function(constituent){
  if (constituent == null)
    return null;
  else if (constituent instanceof StringElement)
    return constituent.getRealisation();
  else if (constituent instanceof WordElement)
    return constituent.getBaseForm();
  else if (constituent instanceof InflectedWordElement)
    return getBaseForm(constituent.getBaseWord());
  else if (constituent instanceof PhraseElement)
    return getBaseForm(constituent.getHead());
  else
    return null;
}


describe('NounPhrase Factory', () => { 
  it("Noun Phrase", (done) => {
    let np = nlg.createNounPhrase();
    should(np).instanceof(NPPhraseSpec);
    done();    
  });

  describe('NounPhraseTest', () => {
    it("testPlural", (done) => {

      let np4 = nlg.createNounPhrase("the", "rock");
      let onTheRock = nlg.createPrepositionPhrase("on");
      onTheRock.addComplement(np4);

      np4.setFeature('NUMBER', 'PLURAL');
      should(realiser.realise(np4).getRealisation()).eql("the rocks");

      let behindTheCurtain = nlg.createPrepositionPhrase("behind");
      let np5 = nlg.createNounPhrase("the", "curtain");
      behindTheCurtain.addComplement(np5);

      np5.setFeature('NUMBER', 'PLURAL');
      should(realiser.realise(np5).getRealisation()).eql("the curtains");

      np5.setFeature('NUMBER', 'SINGULAR');
      should(np5.getFeature('NUMBER')).eql("SINGULAR");
      should(realiser.realise(np5).getRealisation()).eql("the curtain");
      np5.setFeature('NUMBER', 'PLURAL');
      should(realiser.realise(np5).getRealisation()).eql("the curtains");

      done();
    });

    it("testPronominalisation", (done) => {
      // sing
      let proTest1 = nlg.createNounPhrase("the", "singer");
      proTest1.setFeature(LexicalFeature.GENDER, Gender.FEMININE);
      proTest1.setFeature(Feature.PRONOMINAL, true);
      should(realiser.realise(proTest1).getRealisation()).eql("she");

      // sing, possessive
      proTest1.setFeature(Feature.POSSESSIVE, true);
      should(realiser.realise(proTest1).getRealisation()).eql("her");

      // plural pronoun
      let proTest2 = nlg.createNounPhrase("some", "person");
      proTest2.setFeature(Feature.NUMBER, 'PLURAL');
      proTest2.setFeature(Feature.PRONOMINAL, true);
      should(realiser.realise(proTest2).getRealisation()).eql("they");

      // accusative: "them"
      proTest2.setFeature(InternalFeature.DISCOURSE_FUNCTION, 'OBJECT');
      should(realiser.realise(proTest2).getRealisation()).eql("them");

      let proTest3 = nlg.createNounPhrase("Mary");
      proTest3.setFeature(Feature.PRONOMINAL, true);
      proTest3.setFeature(Feature.PERSON, Person.FIRST);
      let sent = nlg.createClause(proTest3, "like", "John");
      should(realiser.realise(sent).getRealisation()).eql("I like John");

      let proTest4 = nlg.createNounPhrase("Mary");
      proTest4.setFeature(Feature.PRONOMINAL, true);
      proTest4.setFeature(Feature.PERSON, Person.SECOND);
      let sent2 = nlg.createClause(proTest4, "like", "John");
      should(realiser.realise(sent2).getRealisation()).eql("you like John");

      let proTest5 = nlg.createNounPhrase("Mary");
      proTest5.setFeature(Feature.PRONOMINAL, true);
      proTest5.setFeature(Feature.PERSON, Person.THIRD);
      proTest5.setFeature(LexicalFeature.GENDER, Gender.FEMININE);
      let sent3 = nlg.createClause(proTest5, "like", "John");
      should(realiser.realise(sent3).getRealisation()).eql("she likes John");

      let proTest6 = nlg.createNounPhrase("Mary");
      proTest6.setFeature(Feature.PRONOMINAL, true);
      proTest6.setFeature(Feature.PERSON, Person.FIRST);
      proTest6.setPlural(true);
      let sent4 = nlg.createClause(proTest6, "like", "John");
      should(realiser.realise(sent4).getRealisation()).eql("we like John");

      let proTest7 = nlg.createNounPhrase("Mary");
      proTest7.setFeature(Feature.PRONOMINAL, true);
      proTest7.setFeature(Feature.PERSON, Person.SECOND);
      proTest7.setPlural(true);
      let sent5 = nlg.createClause(proTest7, "like", "John");
      should(realiser.realise(sent5).getRealisation()).eql("you like John");

      let proTest8 = nlg.createNounPhrase("Mary");
      proTest8.setFeature(Feature.PRONOMINAL, true);
      proTest8.setFeature(Feature.PERSON, Person.THIRD);
      proTest8.setPlural(true);
      proTest8.setFeature(LexicalFeature.GENDER, Gender.FEMININE);
      let sent6 = nlg.createClause(proTest8, "like", "John");
      should(realiser.realise(sent6).getRealisation()).eql("they like John");

      let proTest9 = nlg.createNounPhrase("John");
      proTest9.setFeature(Feature.PRONOMINAL, true);
      proTest9.setFeature(Feature.PERSON, Person.FIRST);
      let sent7 = nlg.createClause("Mary", "like", proTest9);
      should(realiser.realise(sent7).getRealisation()).eql("Mary likes me");

      let proTest10 = nlg.createNounPhrase("John");
      proTest10.setFeature(Feature.PRONOMINAL, true);
      proTest10.setFeature(Feature.PERSON, Person.SECOND);
      let sent8 = nlg.createClause("Mary", "like", proTest10);
      should(realiser.realise(sent8).getRealisation()).eql("Mary likes you");

      let proTest11 = nlg.createNounPhrase("John");
      proTest11.setFeature(Feature.PRONOMINAL, true);
      proTest11.setFeature(Feature.PERSON, Person.THIRD);
      proTest11.setFeature(LexicalFeature.GENDER, Gender.MASCULINE);
      let sent9 = nlg.createClause("Mary", "like", proTest11);
      should(realiser.realise(sent9).getRealisation()).eql("Mary likes him");

      let proTest12 = nlg.createNounPhrase("John");
      proTest12.setFeature(Feature.PRONOMINAL, true);
      proTest12.setFeature(Feature.PERSON, Person.FIRST);
      proTest12.setPlural(true);
      let sent10 = nlg.createClause("Mary", "like", proTest12);
      should(realiser.realise(sent10).getRealisation()).eql("Mary likes us");

      let proTest13 = nlg.createNounPhrase("John");
      proTest13.setFeature(Feature.PRONOMINAL, true);
      proTest13.setFeature(Feature.PERSON, Person.SECOND);
      proTest13.setPlural(true);
      let sent11 = nlg.createClause("Mary", "like", proTest13);
      should(realiser.realise(sent11).getRealisation()).eql("Mary likes you");

      let proTest14 = nlg.createNounPhrase("John");
      proTest14.setFeature(Feature.PRONOMINAL, true);
      proTest14.setFeature(Feature.PERSON, Person.THIRD);
      proTest14.setFeature(LexicalFeature.GENDER, Gender.MASCULINE);
      proTest14.setPlural(true);
      let sent12 = nlg.createClause("Mary", "like", proTest14);
      should(realiser.realise(sent12).getRealisation()).eql("Mary likes them");

      done();
    });

    it("testPremodification", (done) => {

      var man = nlg.createNounPhrase("the", "man"); 
      let woman = nlg.createNounPhrase("the", "woman");
      let dog = nlg.createNounPhrase("the", "dog"); 
      let boy = nlg.createNounPhrase("the", "boy"); 

      let beautiful = nlg.createAdjectivePhrase("beautiful");
      let stunning = nlg.createAdjectivePhrase("stunning");
      let salacious = nlg.createAdjectivePhrase("salacious");

      man.addPreModifier(salacious);
      woman.addPreModifier(beautiful);
      should(realiser.realise(man).getRealisation()).eql("the salacious man");
      should(realiser.realise(woman).getRealisation()).eql("the beautiful woman");

      dog.addPreModifier(stunning);
      should(realiser.realise(dog).getRealisation()).eql("the stunning dog");

      var man = nlg.createNounPhrase("the", "man");
      // premodification with a WordElement
      man.addPreModifier(nlg.createWord("idiotic", LexicalCategory.ADJECTIVE));
      should(realiser.realise(man).getRealisation()).eql("the idiotic man");

      done();
    });
  
    it("testPostmodification", (done) => {

      var man = nlg.createNounPhrase("the", "man");
      var onTheRock = nlg.createPrepositionPhrase("on");
      var np4 = nlg.createNounPhrase("the", "rock");
      onTheRock.addComplement(np4);
      man.addPostModifier(onTheRock);
      should(realiser.realise(man).getRealisation()).eql("the man on the rock");

      var behindTheCurtain = nlg.createPrepositionPhrase("behind");
      var np5 = nlg.createNounPhrase("the", "curtain");
      behindTheCurtain.addComplement(np5);

      var woman = nlg.createNounPhrase("the", "woman");
      woman.addPostModifier(behindTheCurtain);
      should(realiser.realise(woman).getRealisation()).eql("the woman behind the curtain");

      // postmodification with a WordElement
      man.setPostModifier(nlg.createWord("jack", LexicalCategory.NOUN));
      should(realiser.realise(man).getRealisation()).eql("the man jack");
    
      done();
    });

    it("testComplementation", (done) => {

      // complementation with a WordElement
      var man = nlg.createNounPhrase("the", "man");
      man.setComplement(nlg.createWord("jack", LexicalCategory.NOUN));
      should(realiser.realise(man).getRealisation()).eql("the man jack");
      
      var woman = nlg.createNounPhrase("the", "woman");
      var np5 = nlg.createNounPhrase("the", "curtain");

      var behindTheCurtain = nlg.createPrepositionPhrase("behind");
      behindTheCurtain.addComplement(nlg.createNounPhrase("the", "curtain"));

      woman.addComplement(behindTheCurtain);
      should(realiser.realise(woman).getRealisation()).eql("the woman behind the curtain");

      done();
    });

    it("testPossessive", (done) => {
      // simple possessive 's: 'a man's'
      let possNP = nlg.createNounPhrase("a", "man");
      let dog = nlg.createNounPhrase("the", "dog");
      possNP.setFeature(Feature.POSSESSIVE, true);
      should(realiser.realise(possNP).getRealisation()).eql("a man's");

      // now set this possessive as specifier of the NP 'the dog'
      dog.setFeature(InternalFeature.SPECIFIER, possNP);
      should(realiser.realise(dog).getRealisation()).eql("a man's dog");

      // convert possNP to pronoun and turn "a dog" into "his dog"
      // need to specify gender, as default is NEUTER
      possNP.setFeature(LexicalFeature.GENDER, Gender.MASCULINE);
      possNP.setFeature(Feature.PRONOMINAL, true);
      should(realiser.realise(dog).getRealisation()).eql("his dog");

      // make it slightly more complicated: "his dog's rock"
      dog.setFeature(Feature.POSSESSIVE, true); // his dog's

      // his dog's rock (substituting "the" for the entire phrase)
      var np4 = nlg.createNounPhrase("the", "rock");
      np4.setFeature(InternalFeature.SPECIFIER, dog);
      should(realiser.realise(np4).getRealisation()).eql("his dog's rock");

      done();
    });

    it("testCoordination", (done) => {

      let dog = nlg.createNounPhrase("the", "dog");
      let woman = nlg.createNounPhrase("the", "woman");
      let cnp1 = new CoordinatedPhraseElement(dog, woman);
      // simple coordination
      should(realiser.realise(cnp1).getRealisation()).eql("the dog and the woman");

      var behindTheCurtain = nlg.createPrepositionPhrase("behind");
      behindTheCurtain.addComplement(nlg.createNounPhrase("the", "curtain"));

      // simple coordination with complementation of entire coordinate NP
      cnp1.addComplement(behindTheCurtain);
      should(realiser.realise(cnp1).getRealisation()).eql("the dog and the woman behind the curtain");

      // simple coordination of complementised nps
      dog.clearComplements();
      woman.clearComplements();

      let cnp2 = new CoordinatedPhraseElement(dog, woman);
      cnp2.setFeature(Feature.RAISE_SPECIFIER, true);
      should(realiser.realise(cnp2).getRealisation()).eql("the dog and woman");

      var onTheRock = nlg.createPrepositionPhrase("on");
      var np4 = nlg.createNounPhrase("the", "rock");
      onTheRock.addComplement(np4);

      var behindTheCurtain = nlg.createPrepositionPhrase("behind");
      var np5 = nlg.createNounPhrase("the", "curtain");
      behindTheCurtain.addComplement(np5);

      dog.addComplement(onTheRock);
      woman.addComplement(behindTheCurtain);

      let cnp3 = new CoordinatedPhraseElement(dog, woman);
      woman.setFeature(InternalFeature.RAISED, false);

      should(realiser.realise(cnp3).getRealisation()).eql("the dog on the rock and the woman behind the curtain");

      // complementised coordinates + outer pp modifier
      let inTheRoom = nlg.createPrepositionPhrase("in");
      let np6 = nlg.createNounPhrase("the", "room");
      inTheRoom.addComplement(np6);
      cnp3.addPostModifier(inTheRoom);
      should(realiser.realise(cnp3).getRealisation()).eql("the dog on the rock and the woman behind the curtain in the room");

      // set the specifier for this cnp; should unset specifiers for all inner coordinates
      let every = nlg.createWord("every", LexicalCategory.DETERMINER);
      cnp3.setFeature(InternalFeature.SPECIFIER, every);
      should(realiser.realise(cnp3).getRealisation()).eql("every dog on the rock and every woman behind the curtain in the room");

      // pronominalise one of the constituents
      dog.setFeature(Feature.PRONOMINAL, true); // ="it"
      dog.setFeature(InternalFeature.SPECIFIER, nlg.createWord("the", LexicalCategory.DETERMINER));
      // raising spec still returns true as spec has been set
      cnp3.setFeature(Feature.RAISE_SPECIFIER, true);

      // CNP should be realised with pronominal internal const
      // This one is not right
      // should(realiser.realise(cnp3).getRealisation()).eql("it and every woman behind the curtain in the room");
    
      done();
    });
    
    it("testPossessiveCoordinate", (done) => {
      let dog = nlg.createNounPhrase("the", "dog");
      let woman = nlg.createNounPhrase("the", "woman");

      let cnp2 = new CoordinatedPhraseElement(dog, woman);
            
      // set possessive -- wide-scope by default
      cnp2.setFeature(Feature.POSSESSIVE, true);
      should(realiser.realise(cnp2).getRealisation()).eql("the dog and the woman's");

      // set possessive with pronoun
      dog.setFeature(Feature.PRONOMINAL, true);
      dog.setFeature(Feature.POSSESSIVE, true);
      cnp2.setFeature(Feature.POSSESSIVE, true);
      should(realiser.realise(cnp2).getRealisation()).eql("its and the woman's");

      done();
    });

    it("testAn", (done) => {

      var _dog = nlg.createNounPhrase("a", "dog");
      should(realiser.realise(_dog).getRealisation()).eql("a dog");
      
      _dog.addPreModifier("enormous");
      should(realiser.realise(_dog).getRealisation()).eql("an enormous dog");

      let elephant = nlg.createNounPhrase("a", "elephant");
      should(realiser.realise(elephant).getRealisation()).eql("an elephant");

      elephant.addPreModifier("big");
      should(realiser.realise(elephant).getRealisation()).eql("a big elephant");

      // test treating of plural specifiers
      _dog.setFeature(Feature.NUMBER, NumberAgreement.PLURAL);
      should(realiser.realise(_dog).getRealisation()).eql("some enormous dogs");
      

      // Further tests for a/an agreement with coordinated premodifiers
      var _dog = nlg.createNounPhrase("a", "dog");
      _dog.addPreModifier(nlg.createCoordinatedPhrase("enormous", "black"));
      should(realiser.realise(_dog).getRealisation()).eql("an enormous and black dog");

      // Test for a/an agreement with numbers
      var num = nlg.createNounPhrase("a", "change");
    
      // no an with "one"
      num.setPreModifier("one percent");
      should(realiser.realise(num).getRealisation()).eql("a one percent change");

      // an with "eighty"
      num.setPreModifier("eighty percent");
      should(realiser.realise(num).getRealisation()).eql("an eighty percent change");

      // an with 80
      num.setPreModifier("80%");
      should(realiser.realise(num).getRealisation()).eql("an 80% change");

      // an with 80000
      num.setPreModifier("80000");
      should(realiser.realise(num).getRealisation()).eql("an 80000 change");

      // an with 11,000
      num.setPreModifier("11,000");
      should(realiser.realise(num).getRealisation()).eql("an 11,000 change");

      // an with 18
      num.setPreModifier("18%");
      should(realiser.realise(num).getRealisation()).eql("an 18% change");

      // a with 180
      num.setPreModifier("180");
      should(realiser.realise(num).getRealisation()).eql("a 180 change");

      // a with 1100
      num.setPreModifier("1100");
      should(realiser.realise(num).getRealisation()).eql("a 1100 change");

      // a with 180,000
      num.setPreModifier("180,000");
      should(realiser.realise(num).getRealisation()).eql("a 180,000 change");

      // an with 11000
      num.setPreModifier("11000");
      should(realiser.realise(num).getRealisation()).eql("an 11000 change");

      // an with 18000
      num.setPreModifier("18000");
      should(realiser.realise(num).getRealisation()).eql("an 18000 change");

      // an with 18.1
      num.setPreModifier("18.1%");
      should(realiser.realise(num).getRealisation()).eql("an 18.1% change");

      // an with 11.1
      num.setPreModifier("11.1%");
      should(realiser.realise(num).getRealisation()).eql("an 11.1% change");
      done();
    });

    // Guest Placement
    it("testModifier", (done) => {
      var _dog = nlg.createNounPhrase("a", "dog");
      _dog.addPreModifier("angry");
      should(realiser.realise(_dog).getRealisation()).eql("an angry dog");

      _dog.addPostModifier("in the park");
      should(realiser.realise(_dog).getRealisation()).eql("an angry dog in the park");

      var cat = nlg.createNounPhrase("a", "cat");
      cat.addPreModifier(nlg.createAdjectivePhrase("angry"));
      should(realiser.realise(cat).getRealisation()).eql("an angry cat");

      cat.addPostModifier(nlg.createPrepositionPhrase("in", "the park"));
      should(realiser.realise(cat).getRealisation()).eql("an angry cat in the park");

      done();
    });

    it.skip("testPluralNounsBelongingToASingular", (done) => {
      let sent = nlg.createClause("I", "count up");
      sent.setFeature(Feature.TENSE, Tense.PAST);

      let obj = nlg.createNounPhrase("digit"); 
      obj.setPlural(true);

      let possessor = nlg.createNounPhrase("the", "box");
      possessor.setPlural(false);
      possessor.setFeature(Feature.POSSESSIVE, true);
      obj.setSpecifier(possessor);
      sent.setObject(obj);

      should(realiser.realise(sent).getRealisation()).eql("I counted up the box's digits");
      done();
    });
    
    it.skip("testSingularNounsBelongingToAPlural", (done) => {
      let sent = nlg.createClause("I", "clean");
      sent.setFeature(Feature.TENSE, Tense.PAST);
      
      let obj = nlg.createNounPhrase("car"); 
      obj.setPlural(false);
      let possessor = nlg.createNounPhrase("the", "parent");
      possessor.setPlural(true);
      possessor.setFeature(Feature.POSSESSIVE, true);
      obj.setSpecifier(possessor);
      sent.setObject(obj);

      should(realiser.realise(sent).getRealisation()).eql("I cleaned the parents' car");
      done();
    });

    // Test for appositive postmodifiers
    it("testAppositivePostmodifier", (done) => {

      let _dog = nlg.createNounPhrase("the", "dog");
      let _rott = nlg.createNounPhrase("a", "rottweiler");
      _rott.setFeature(Feature.APPOSITIVE, true);
      _dog.addPostModifier(_rott);
      let sent = nlg.createClause(_dog, "ran");
      should(realiser.realise(sent).getRealisation()).eql("the dog, a rottweiler runs");
      
      done();
    });

  });

  describe('PhraseSpecTests', () => {
    it("testSPhraseSpec 1", (done) => {

      // simple test of methods
      let c1 = nlg.createClause();
      c1.setVerb("give");
      c1.setSubject("John");
      c1.setObject("an apple");
      c1.setIndirectObject("Mary");
      c1.setFeature('TENSE', 'PAST');
      c1.setFeature('NEGATED', true);

      // check getXXX methods
      should(getBaseForm(c1.getVerb())).eql("give");
      should(getBaseForm(c1.getSubject())).eql("John");
      should(getBaseForm(c1.getObject())).eql("an apple");
      should(getBaseForm(c1.getIndirectObject())).eql("Mary");

      should(realiser.realise(c1).getRealisation()).eql("John did not give Mary an apple");
      done();
    });

    it("testSPhraseSpec 2", (done) => {

      // test modifier placement
      let c2 = nlg.createClause();
      c2.setVerb("see");
      c2.setSubject("the man");
      c2.setObject("me");
      c2.addModifier("fortunately");
      c2.addModifier("quickly");
      c2.addModifier("in the park");
      // try setting tense directly as a feature
      c2.setFeature('TENSE', 'PAST');

      should(realiser.realise(c2).getRealisation()).eql("fortunately the man quickly saw me in the park");
      done();
    });
  });

  describe('Syntax', () => {
    describe('StringElement', () => { 
    
      it("stringElementAsHeadTest", (done) => {
        let np = nlg.createNounPhrase();
        np.setHead(nlg.createStringElement("dogs and cats"));
        np.setSpecifier(nlg.createWord("the", "DETERMINER"));

        should(realiser.realise(np).getRealisation()).eql("the dogs and cats");
        done();
      });

      it("stringElementAsVPTest", (done) => {
        let s = nlg.createClause();
        s.setVerbPhrase(nlg.createStringElement("eats and drinks"));
        s.setSubject(nlg.createStringElement("the big fat man"));      
        should(realiser.realise(s).getRealisation()).eql("the big fat man eats and drinks");
        done();
      });
    });
  });
});
