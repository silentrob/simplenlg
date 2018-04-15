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
import Form from '../src/features/Form';
import DiscourseFunction from '../src/features/DiscourseFunction';

import LexicalCategory from '../src/features/LexicalCategory';

import mocha from 'mocha';
import should from 'should/as-function';

const lexicon = new Lexicon('small-lexicon.xml');
const nlg = new NLG(lexicon);
const realiser = new Realiser(lexicon);

describe('Verb Phrase interface', () => { 

  it("testVerbParticle", (done) => {

    let v = nlg.createVerbPhrase("fall down");

    should(v.getFeatureAsString(Feature.PARTICLE)).eql("down");
    should(v.getVerb().getBaseForm()).eql("fall");
    
    v.setFeature(Feature.TENSE, Tense.PAST);
    v.setFeature(Feature.PERSON, Person.THIRD);
    v.setFeature(Feature.NUMBER, NumberAgreement.PLURAL);

    should(realiser.realise(v).getRealisation()).eql("fell down");

    v.setFeature(Feature.FORM, Form.PAST_PARTICIPLE);
    should(realiser.realise(v).getRealisation()).eql("fallen down");

    done();
  });

  it("simplePastTest", (done) => {
    let fallDown = nlg.createVerbPhrase("fall down");
    fallDown.setFeature(Feature.TENSE, Tense.PAST);
    should(realiser.realise(fallDown).getRealisation()).eql("fell down");

    done();
  });

  it("tenseAspectTest", (done) => {
      
    let fallDown = nlg.createVerbPhrase("fall down");
    let kick = nlg.createVerbPhrase("kick");
    var man = nlg.createNounPhrase("the", "man"); 

    fallDown.setFeature(Feature.TENSE,Tense.PAST);
    fallDown.setFeature(Feature.PERFECT, true);
    should(realiser.realise(fallDown).getRealisation()).eql("had fallen down");

    // had been falling down
    fallDown.setFeature(Feature.PROGRESSIVE, true);
    should(realiser.realise(fallDown).getRealisation()).eql("had been falling down");

    // will have been kicked
    kick.setFeature(Feature.PASSIVE, true);
    kick.setFeature(Feature.PERFECT, true);
    kick.setFeature(Feature.TENSE,Tense.FUTURE);
    should(realiser.realise(kick).getRealisation()).eql("will have been kicked");

    // will have been being kicked
    kick.setFeature(Feature.PROGRESSIVE, true);
    should(realiser.realise(kick).getRealisation()).eql("will have been being kicked");

    // will not have been being kicked
    kick.setFeature(Feature.NEGATED, true);
    should(realiser.realise(kick).getRealisation()).eql("will not have been being kicked");
  
    // passivisation should suppress the complement
    kick.clearComplements();
    kick.addComplement(man);
    should(realiser.realise(kick).getRealisation()).eql("will not have been being kicked");

    // de-passivisation should now give us "will have been kicking the man"
    kick.setFeature(Feature.PASSIVE, false);
    should(realiser.realise(kick).getRealisation()).eql("will not have been kicking the man");
    
    // remove the future tense --
    // this is a test of an earlier bug that would still realise "will"
    kick.setFeature(Feature.TENSE,Tense.PRESENT);
    should(realiser.realise(kick).getRealisation()).eql("has not been kicking the man");

    done();
  });

  it("complementationTest", (done) => {
    // was kissing Mary
    let mary = nlg.createNounPhrase("Mary");
    let kiss = nlg.createVerbPhrase("kiss");
    mary.setFeature(InternalFeature.DISCOURSE_FUNCTION, DiscourseFunction.OBJECT);
    kiss.clearComplements();
    kiss.addComplement(mary);
    kiss.setFeature(Feature.PROGRESSIVE, true);
    kiss.setFeature(Feature.TENSE,Tense.PAST);
    should(realiser.realise(kiss).getRealisation()).eql("was kissing Mary");

    let mary2 = new CoordinatedPhraseElement(mary, nlg.createNounPhrase("Susan")); 
    // add another complement -- should come out as "Mary and Susan"
    kiss.clearComplements();
    kiss.addComplement(mary2);
    should(realiser.realise(kiss).getRealisation()).eql("was kissing Mary and Susan");
    
    // passivise -- should make the direct object complement disappear
    // Note: The verb doesn't come out as plural because agreement
    // is determined by the sentential subjects and this VP isn't inside a
    // sentence
    kiss.setFeature(Feature.PASSIVE, true);
    should(realiser.realise(kiss).getRealisation()).eql("was being kissed");

    // make it plural (this is usually taken care of in SPhraseSpec)
    kiss.setFeature(Feature.NUMBER, NumberAgreement.PLURAL);
    should(realiser.realise(kiss).getRealisation()).eql("were being kissed");

    // depassivise and add post-mod: yields "was kissing Mary in the room"
    let inTheRoom = nlg.createPrepositionPhrase("in");
    inTheRoom.addComplement(nlg.createNounPhrase("the", "room"));

    kiss.addPostModifier(inTheRoom);
    kiss.setFeature(Feature.PASSIVE, false);
    kiss.setFeature(Feature.NUMBER, NumberAgreement.SINGULAR);
    should(realiser.realise(kiss).getRealisation()).eql("was kissing Mary and Susan in the room");


    // passivise again: should make direct object disappear, but not postMod
    // ="was being kissed in the room"
    kiss.setFeature(Feature.PASSIVE, true);
    kiss.setFeature(Feature.NUMBER, NumberAgreement.PLURAL);
    should(realiser.realise(kiss).getRealisation()).eql("were being kissed in the room");

    done();
  });

  /**
   * This tests for the default complement ordering, relative to pre and
   * postmodifiers.
   */
  it("complementationTest_2", (done) => {

    let woman = nlg.createNounPhrase("the", "woman");
    let boy = nlg.createNounPhrase("the", "boy");
    let dog = nlg.createNounPhrase("the", "dog");
    let give = nlg.createVerbPhrase("give"); 
    // give the woman the dog
    woman.setFeature(InternalFeature.DISCOURSE_FUNCTION, DiscourseFunction.INDIRECT_OBJECT);
    dog.setFeature(InternalFeature.DISCOURSE_FUNCTION, DiscourseFunction.OBJECT);
    give.clearComplements();
    give.addComplement(dog);
    give.addComplement(woman);
    should(realiser.realise(give).getRealisation()).eql("gives the woman the dog");

    let behindTheCurtain = nlg.createPrepositionPhrase("behind");
    behindTheCurtain.addComplement(nlg.createNounPhrase("the", "curtain"));

    let inTheRoom = nlg.createPrepositionPhrase("in");
    inTheRoom.addComplement(nlg.createNounPhrase("the", "room"));

    // add a few premodifiers and postmodifiers
    give.addPreModifier("slowly");
    give.addPostModifier(behindTheCurtain);
    give.addPostModifier(inTheRoom);
    should(realiser.realise(give).getRealisation()).eql("slowly gives the woman the dog behind the curtain in the room");

    // reset the arguments
    give.clearComplements();
    give.addComplement(dog);
    let womanBoy = new CoordinatedPhraseElement(woman, boy);
    womanBoy.setFeature(InternalFeature.DISCOURSE_FUNCTION, DiscourseFunction.INDIRECT_OBJECT);
    give.addComplement(womanBoy);

    // if we unset the passive, we should get the indirect objects
    // they won't be coordinated
    give.setFeature(Feature.PASSIVE, false);
    should(realiser.realise(give).getRealisation()).eql("slowly gives the woman and the boy the dog behind the curtain in the room");

    // set them to a coordinate instead
    // set ONLY the complement INDIRECT_OBJECT, leaves OBJECT intact
    give.clearComplements();
    give.addComplement(womanBoy);
    give.addComplement(dog);
    let complements = give.getFeatureAsElementList(InternalFeature.COMPLEMENTS);

    let indirectCount = 0;
    for (let i = 0; i <  complements.length; i++){
      let eachElement = complements[i];
      if (DiscourseFunction.INDIRECT_OBJECT == eachElement.getFeature(InternalFeature.DISCOURSE_FUNCTION)) {
        indirectCount++;
      }
    }
    should(indirectCount).eql(1); // only one indirect object

    // where there were two before
    should(realiser.realise(give).getRealisation()).eql("slowly gives the woman and the boy the dog behind the curtain in the room");
    done();
  });

  it("passiveComplementTest", (done) => {
    let woman = nlg.createNounPhrase("the", "woman");
    let dog = nlg.createNounPhrase("the", "dog");
    let give = nlg.createVerbPhrase("give"); 

    let behindTheCurtain = nlg.createPrepositionPhrase("behind");
    behindTheCurtain.addComplement(nlg.createNounPhrase("the", "curtain"));

    let inTheRoom = nlg.createPrepositionPhrase("in");
    inTheRoom.addComplement(nlg.createNounPhrase("the", "room"));

    // add some arguments
    dog.setFeature(InternalFeature.DISCOURSE_FUNCTION, DiscourseFunction.OBJECT);
    woman.setFeature(InternalFeature.DISCOURSE_FUNCTION, DiscourseFunction.INDIRECT_OBJECT);
    give.addComplement(dog);
    give.addComplement(woman);
    should(realiser.realise(give).getRealisation()).eql("gives the woman the dog");

    // add a few premodifiers and postmodifiers
    give.addPreModifier("slowly");
    give.addPostModifier(behindTheCurtain);
    give.addPostModifier(inTheRoom);
    should(realiser.realise(give).getRealisation()).eql("slowly gives the woman the dog behind the curtain in the room");

    // passivise: This should suppress "the dog"
    give.clearComplements();
    give.addComplement(dog);
    give.addComplement(woman);
    give.setFeature(Feature.PASSIVE, true);
    should(realiser.realise(give).getRealisation()).eql("is slowly given the woman behind the curtain in the room");

    done();
  });


  it.skip("clausalComplementTest", (done) => {
    let s = nlg.createClause();

    s.setSubject(nlg.createNounPhrase("John"));

    // Create a sentence first
    let maryAndSusan = new CoordinatedPhraseElement(nlg.createNounPhrase("Mary"), nlg.createNounPhrase("Susan"));
    let kiss = nlg.createVerbPhrase("kiss");

    let inTheRoom = nlg.createPrepositionPhrase("in");
    inTheRoom.addComplement(nlg.createNounPhrase("the", "room"));

    let behindTheCurtain = nlg.createPrepositionPhrase("behind");
    behindTheCurtain.addComplement(nlg.createNounPhrase("the", "curtain"));

    kiss.clearComplements();
    s.setVerbPhrase(kiss);
    s.setObject(maryAndSusan);
    s.setFeature(Feature.PROGRESSIVE, true);
    s.setFeature(Feature.TENSE, Tense.PAST);
    s.addPostModifier(inTheRoom);

    should(realiser.realise(s).getRealisation()).eql("John was kissing Mary and Susan in the room");

    let say = nlg.createVerbPhrase("say");
    // make the main VP past
    say.setFeature(Feature.TENSE, Tense.PAST);
    should(realiser.realise(say).getRealisation()).eql("said");

    // now add the sentence as complement of "say". Should make the sentence
    // subordinate
    // note that sentential punctuation is suppressed
    say.addComplement(s);
    should(realiser.realise(say).getRealisation()).eql("said that John was kissing Mary and Susan in the room");

    // add a postModifier to the main VP
    // yields [says [that John was kissing Mary and Susan in the room]
    // [behind the curtain]]
    say.addPostModifier(behindTheCurtain);

    should(realiser.realise(say).getRealisation()).eql("said that John was kissing Mary and Susan in the room behind the curtain");

    // create a new sentential complement
    let s2 = nlg.createClause(nlg.createNounPhrase("all"), "be", nlg.createAdjectivePhrase("fine"));

    s2.setFeature(Feature.TENSE, Tense.FUTURE);
    should(realiser.realise(s2).getRealisation()).eql("all will be fine");

    // add the new complement to the VP
    // yields [said [that John was kissing Mary and Susan in the room and
    // all will be fine] [behind the curtain]]
    let s3 = new CoordinatedPhraseElement(s, s2);

    s3.setFeature(Feature.SUPRESSED_COMPLEMENTISER, true);
    say.clearComplements();
    say.addComplement(s3);

    // first with outer complementiser suppressed
    
    should(realiser.realise(say).getRealisation()).eql("said that John was kissing Mary and Susan in the room and all will be fine behind the curtain");
    done();

  });

  it("clausalComplementTest_part2", (done) => {

    let s = nlg.createClause();
    s.setSubject(nlg.createNounPhrase("John"));

    let s2 = nlg.createClause(nlg.createNounPhrase("all"), "be", nlg.createAdjectivePhrase("fine"));

    // Create a sentence first
    let maryAndSusan = new CoordinatedPhraseElement(nlg.createNounPhrase("Mary"),nlg.createNounPhrase("Susan"));

    let kiss = nlg.createVerbPhrase("kiss");

    let inTheRoom = nlg.createPrepositionPhrase("in");
    inTheRoom.addComplement(nlg.createNounPhrase("the", "room"));

    let behindTheCurtain = nlg.createPrepositionPhrase("behind");
    behindTheCurtain.addComplement(nlg.createNounPhrase("the", "curtain"));

    s.setVerbPhrase(kiss);
    s.setObject(maryAndSusan);
    s.setFeature(Feature.PROGRESSIVE, true);
    s.setFeature(Feature.TENSE,Tense.PAST);
    s.addPostModifier(inTheRoom);
    s2 = nlg.createClause(nlg.createNounPhrase("all"), "be", nlg.createAdjectivePhrase("fine"));

    s2.setFeature(Feature.TENSE, Tense.FUTURE);
    // then with complementiser not suppressed and not aggregated
    let s3 = new CoordinatedPhraseElement(s, s2);
    let say = nlg.createVerbPhrase("say");
    say.addComplement(s3);
    say.setFeature(Feature.TENSE, Tense.PAST);
    say.addPostModifier(behindTheCurtain);
    
    should(realiser.realise(say).getRealisation()).eql("said that John was kissing Mary and Susan in the room and that all will be fine behind the curtain");
    done();
  });

  /**
   * Test VP coordination and aggregation:
   * <OL>
   * <LI>If the simplenlg.features of a coordinate VP are set, they should be
   * inherited by its daughter VP;</LI>
   * <LI>2. We can aggregate the coordinate VP so it's realised with one
   * wide-scope auxiliary</LI>
   */
  
  it("coordinationTest", (done) => {

      let boy = nlg.createNounPhrase("the", "boy");
      let dog = nlg.createNounPhrase("the", "dog");

      let kiss = nlg.createVerbPhrase("kiss");
      let kick = nlg.createVerbPhrase("kick");

      kiss.addComplement(dog);
      kick.addComplement(boy);

      let coord1 = new CoordinatedPhraseElement(kiss, kick);

      coord1.setFeature(Feature.PERSON, Person.THIRD);
      coord1.setFeature(Feature.TENSE, Tense.PAST);

      should(realiser.realise(coord1).getRealisation()).eql("kissed the dog and kicked the boy");

      // // with negation: should be inherited by all components
      // coord1.setFeature(Feature.NEGATED, true);
      // this.realiser.setLexicon(this.lexicon);
      // assertEquals("did not kiss the dog and did not kick the boy",
      //         this.realiser.realise(coord1).getRealisation());

      // // set a modal
      // coord1.setFeature(Feature.MODAL, "could");
      // assertEquals(
      //                 "could not have kissed the dog and could not have kicked the boy",
      //                 this.realiser.realise(coord1).getRealisation());

      // // set perfect and progressive
      // coord1.setFeature(Feature.PERFECT, true);
      // coord1.setFeature(Feature.PROGRESSIVE, true);
      // assertEquals("could not have been kissing the dog and "
      //         + "could not have been kicking the boy", this.realiser.realise(
      //         coord1).getRealisation());

      // // now aggregate
      // coord1.setFeature(Feature.AGGREGATE_AUXILIARY, true);
      // assertEquals(
      //         "could not have been kissing the dog and kicking the boy",
      //         this.realiser.realise(coord1).getRealisation());
    


    done();
  });

});
