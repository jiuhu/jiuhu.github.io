//--------------------------------------------------------------------
//
//	PlayingCharacter.h
//
//	Sora Development
//

#ifndef _SORA_PLAYING_CHARACTER_H
#define _SORA_PLAYING_CHARACTER_H

class PlayingCharacter
{
public:
	PlayingCharacter()
		: m_maxHP(10), m_hp(10), m_damage(3)
	{}

	void setMaxHP(int hp) { m_maxHP = hp;  m_hp = hp; }
	int getHP() const { return m_hp; }
	int getMaxHP() const { return m_maxHP; }
	void setDamage(int damage) { m_damage = damage; }
	int getDamage() const { return m_damage; }
	virtual void reset() { m_maxHP = m_hp = 10; m_damage = 3; }

	void damaged(int dm) { m_hp -= dm; if (isDead()) m_hp = 0; }
	bool isDead() { return (m_hp <= 0); }
	void heal() { if (m_hp < m_maxHP) m_hp++; }
	void fullHealth() { m_hp = m_maxHP; }

	static void setCriticalHP(int hp) {	m_cricticalHP = hp; }
	static int getCriticalHP() { return m_cricticalHP; }
	static void setHighHP(int hp) { m_highHP = hp; }
	static int getHighHP() { return m_highHP; }

protected:
	int m_hp;
	int m_maxHP;
	int m_damage;

	static int m_cricticalHP;
	static int m_highHP;
};
//--------------------------------------------------------------------

#endif