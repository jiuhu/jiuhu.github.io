#include "EnemyCharacter.h"
#include "Utilities\Helper.h"
//--------------------------------------------------------------------

int EnemyCharacter::m_encounterChance = 50;
//--------------------------------------------------------------------

const char * StateMsg[EnemyCharacter::TOTAL_STATE] =
{
	"PATROL",
	"ENCOUNTER",
	"ESCAPE",
	"REST",
	"DEAD",
};
//--------------------------------------------------------------------

const char * EnemyCharacter::getStateString() const
{
	return StateMsg[m_state];
}
//--------------------------------------------------------------------

void EnemyCharacter::changeState(StateType newState)
{
	m_enemyMessage << "Change State : " << getStateString() << " -> ";
	m_state = newState;
	m_enemyMessage << getStateString() << "\n";
}
//--------------------------------------------------------------------

const std::string EnemyCharacter::update(PlayingCharacter &player)
{
	m_enemyMessage.str("");
	m_enemyMessage << "Current State : " << getStateString() << "\n";

	switch (getState())
	{
	case PATROL:
		if (detectPlayer())
		{
			if (player.isDead())
			{
				player.fullHealth();
			}
			encounter();
		}
		else
		{
			patroling();
		}
		break;

	case ENCOUNTER:
		if (criticalHealth())
		{
			attack(player);
		}
		else
		{
			flee();
		}
		break;

	case ESCAPE:
		if (detectPlayer())
		{
			encounter();
		}
		else
		{
			getRest();
		}
		break;

	case REST:
		if (highHealth())
		{
			startPatrol();
		}
		else
		{
			resting();
		}
		break;
	}

	return m_enemyMessage.str();
}
//--------------------------------------------------------------------

bool EnemyCharacter::highHealth()
{
	m_enemyMessage << "Sense : Reviewing my HP\n";
	if (m_hp > m_highHP)
	{
		m_enemyMessage << "Think : My HP is high\n";
		return true;
	}
	else
	{
		m_enemyMessage << "Think : My HP is low\n";
		return false;
	}
}
//--------------------------------------------------------------------


bool EnemyCharacter::criticalHealth()
{
	m_enemyMessage << "Sense : Reviewing my HP\n";
	if (m_hp > m_cricticalHP)
	{
		m_enemyMessage << "Think : My HP is high\n";
		return true;
	}
	else
	{
		m_enemyMessage << "Think : My HP is low\n";
		return false;
	}
}
//--------------------------------------------------------------------

bool EnemyCharacter::detectPlayer()
{
	int probability = sora::randomNumber(0, 100);
	m_enemyMessage << "Sense : Detecting player... (Roll: " << probability << ")\n";
	if (probability < m_encounterChance)
	{
		m_enemyMessage << "Think : Detect player\n";
		return true;
	}
	else
	{
		m_enemyMessage << "Think : Didn't detect player\n";
		return false;
	}
}
//--------------------------------------------------------------------

void EnemyCharacter::attack(PlayingCharacter &player)
{
	m_enemyMessage << "Action : Attack!!!\n";
	player.damaged(m_damage);
	damaged(player.getDamage());

	if (player.isDead())
	{
		m_enemyMessage << "Sense : I defeated the player\n";
		changeState(REST);
	}

	if (isDead())
	{
		changeState(DEAD);
		m_enemyMessage << "Think : I'm dead\n";
	}
}
//--------------------------------------------------------------------

void EnemyCharacter::encounter()
{
	changeState(ENCOUNTER);
	m_enemyMessage << "Action : Get ready for encounter\n";
}
//--------------------------------------------------------------------

void EnemyCharacter::startPatrol()
{
	changeState(PATROL);
	m_enemyMessage << "Action : Get ready for patroling\n";
}
//--------------------------------------------------------------------

void EnemyCharacter::patroling()
{
	m_enemyMessage << "Action : I'm patroling\n";
}
//--------------------------------------------------------------------

void EnemyCharacter::flee()
{
	changeState(ESCAPE);
	m_enemyMessage << "Action : Flee\n";
}
//--------------------------------------------------------------------

void EnemyCharacter::getRest()
{
	changeState(REST);
	m_enemyMessage << "Action : Get ready for some rest\n";
}
//--------------------------------------------------------------------

void EnemyCharacter::resting()
{
	m_enemyMessage << "Action : I'm resting\n";
	if (m_hp < m_maxHP)
		m_hp++;
}
//--------------------------------------------------------------------