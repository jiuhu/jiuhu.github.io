//--------------------------------------------------------------------
//
//	EnemyCharacter.h
//
//	Sora Development
//

#ifndef _SORA_ENEMY_CHARACTER_H
#define _SORA_ENEMY_CHARACTER_H

#include "PlayingCharacter.h"
#include <sstream>
//--------------------------------------------------------------------

struct StateMachine
{

};
//--------------------------------------------------------------------

class string;

class EnemyCharacter : public PlayingCharacter
{
public:
	enum StateType 
	{ 
		PATROL, 
		ENCOUNTER,
		ESCAPE,
		REST,
		DEAD,

		TOTAL_STATE
	};
	
	EnemyCharacter()
		: m_state(PATROL), m_enemyMessage("")
	{}
	
	void reset() { PlayingCharacter::reset(); m_state = PATROL; }

	const char * getStateString() const;
	StateType getState() { return m_state; }
	void changeState(StateType newState);
	void initialState() { m_state = PATROL; fullHealth(); }

	const std::string update(PlayingCharacter &player);

	void startPatrol();
	void patroling();
	void encounter();
	void attack(PlayingCharacter &player);
	void flee();
	void getRest();
	void resting();

	bool criticalHealth();
	bool highHealth();
	bool detectPlayer();

	bool isDead() const { return m_state == DEAD; }

	static void setEncounterChance(int chance) { m_encounterChance = chance; }
	static int getEncounterChance() { return m_encounterChance; }
	
private:
	StateType m_state;
	static int m_encounterChance;

	std::stringstream m_enemyMessage;
	//--------------------------------------------------------------------
};
//--------------------------------------------------------------------

#endif